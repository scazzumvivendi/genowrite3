import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { GenowriteDatabase, readProject } from '../../database/db';
import { ProjectService } from './project-service';
import { DraftSaver } from './draft-saver';
import { validateContent } from '../manuscript/validation';

const databases: GenowriteDatabase[] = [];
async function fixture() {
  const database = new GenowriteDatabase(`test-${crypto.randomUUID()}`);
  databases.push(database);
  const service = new ProjectService(database);
  const projectId = await service.createProject('Romanzo');
  const chapterId = await service.addNode(
    projectId,
    null,
    'chapter',
    'Capitolo',
  );
  const snapshot = await readProject(database, projectId);
  return {
    database,
    service,
    projectId,
    chapterId,
    document: snapshot.documents[0]!,
  };
}
afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()));
});
const content = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'È una città…', marks: [{ type: 'bold' }] },
      ],
    },
  ],
};

describe('dominio e transazioni', () => {
  it('mantiene documenti, ID e metadati dopo riapertura', async () => {
    const f = await fixture();
    await f.service.saveDocument(f.document.id, content, 0);
    f.database.close();
    await f.database.open();
    const result = await readProject(f.database, f.projectId);
    expect(result.documents[0]?.content).toEqual(content);
    expect(result.nodes[0]?.id).toBe(f.chapterId);
  });
  it('rifiuta genitori invalidi, scene in capitoli diretti e cicli', async () => {
    const f = await fixture();
    await expect(
      f.service.addNode(f.projectId, null, 'scene', 'Scena'),
    ).rejects.toThrow();
    await expect(
      f.service.addNode(f.projectId, f.chapterId, 'scene', 'Scena'),
    ).rejects.toThrow();
    const folder = await f.service.addNode(
      f.projectId,
      null,
      'folder',
      'Cartella',
    );
    const child = await f.service.addNode(
      f.projectId,
      folder,
      'folder',
      'Sotto',
    );
    await expect(
      f.service.moveNode(f.projectId, folder, child, 0),
    ).rejects.toThrow('ciclo');
    const other = await f.service.createProject('Altro');
    await expect(
      f.service.addNode(other, f.chapterId, 'chapter', 'No'),
    ).rejects.toThrow();
  });
  it('sposta senza cambiare ID o contenuti', async () => {
    const f = await fixture();
    await f.service.saveDocument(f.document.id, content, 0);
    const part = await f.service.addNode(f.projectId, null, 'part', 'Parte');
    await f.service.moveNode(f.projectId, f.chapterId, part, 0);
    expect((await f.database.nodes.get(f.chapterId))?.parentId).toBe(part);
    expect((await f.database.documents.get(f.document.id))?.content).toEqual(
      content,
    );
  });
  it('converte e recupera atomicamente una scena senza perdere formattazione', async () => {
    const f = await fixture();
    await f.service.saveDocument(f.document.id, content, 0);
    const result = await f.service.convertToScenes(f.projectId, f.chapterId);
    expect(
      (await f.database.nodes.get(f.chapterId))?.documentId,
    ).toBeUndefined();
    expect((await f.database.documents.get(f.document.id))?.ownerNodeId).toBe(
      result.sceneId,
    );
    expect((await f.database.documents.get(f.document.id))?.content).toEqual(
      content,
    );
    await f.service.undoConversion(
      f.projectId,
      f.chapterId,
      result.sceneId,
      result.revision,
    );
    expect((await f.database.nodes.get(f.chapterId))?.mode).toBe('direct');
    expect(await f.database.nodes.get(result.sceneId)).toBeUndefined();
  });
  it('un errore durante la conversione lascia il capitolo originale intatto', async () => {
    const f = await fixture();
    const failure = () => {
      throw new Error('Quota simulata');
    };
    f.database.documents.hook('updating', failure);
    await expect(
      f.service.convertToScenes(f.projectId, f.chapterId),
    ).rejects.toThrow('Quota simulata');
    f.database.documents.hook('updating').unsubscribe(failure);
    expect((await f.database.nodes.get(f.chapterId))?.mode).toBe('direct');
    expect((await f.database.documents.get(f.document.id))?.ownerNodeId).toBe(
      f.chapterId,
    );
    expect(await f.database.nodes.count()).toBe(1);
  });
  it('cestino e ripristino conservano documenti e relazioni', async () => {
    const f = await fixture();
    await f.service.setNodeDeleted(f.projectId, f.chapterId, true);
    expect((await f.database.nodes.get(f.chapterId))?.deletedAt).toBeTruthy();
    expect(await f.database.documents.get(f.document.id)).toBeDefined();
    await f.service.setNodeDeleted(f.projectId, f.chapterId, false);
    expect(
      (await f.database.nodes.get(f.chapterId))?.deletedAt,
    ).toBeUndefined();
    await f.service.setProjectDeleted(f.projectId, true);
    await expect(
      f.service.addNode(f.projectId, null, 'chapter', 'No'),
    ).rejects.toThrow();
    await f.service.setProjectDeleted(f.projectId, false);
    expect((await readProject(f.database, f.projectId)).documents).toHaveLength(
      1,
    );
  });
  it('rifiuta scritture concorrenti invece di sovrascrivere contenuti', async () => {
    const f = await fixture();
    await f.service.saveDocument(f.document.id, content, 0);
    await expect(
      f.service.saveDocument(f.document.id, f.document.content, 0),
    ).rejects.toThrow('altra scheda');
    expect((await f.database.documents.get(f.document.id))?.content).toEqual(
      content,
    );
  });
  it('la coda conserva gli ultimi caratteri e permette di ritentare dopo errore', async () => {
    const f = await fixture();
    const states: string[] = [];
    const saver = new DraftSaver(
      f.service,
      (state) => states.push(state),
      10_000,
    );
    saver.enqueue(f.document.id, content, 0);
    const failure = () => {
      throw new Error('Quota');
    };
    f.database.documents.hook('updating', failure);
    await expect(saver.flush()).rejects.toThrow();
    expect(saver.dirty).toBe(true);
    expect(states).toContain('error');
    f.database.documents.hook('updating').unsubscribe(failure);
    await saver.flush();
    expect(saver.dirty).toBe(false);
    expect((await f.database.documents.get(f.document.id))?.content).toEqual(
      content,
    );
  });
  it('rifiuta HTML e attributi o mark non supportati', () => {
    expect(() =>
      validateContent({
        type: 'doc',
        content: [{ type: 'html', text: '<script/>' }],
      }),
    ).toThrow();
    expect(() =>
      validateContent({
        type: 'doc',
        content: [{ type: 'paragraph', attrs: { onclick: 'x' } }],
      }),
    ).toThrow();
  });
});

it('la coda seriale non perde una modifica arrivata durante una scrittura', async () => {
  const f = await fixture();
  let release: () => void = () => undefined;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  class PausedService extends ProjectService {
    override async saveDocument(
      ...args: Parameters<ProjectService['saveDocument']>
    ) {
      await wait;
      return super.saveDocument(...args);
    }
  }
  const saver = new DraftSaver(
    new PausedService(f.database),
    () => undefined,
    10_000,
  );
  saver.enqueue(f.document.id, content, 0);
  const saving = saver.flush();
  const latest = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Ultima modifica' }],
      },
    ],
  };
  saver.enqueue(f.document.id, latest, 0);
  release();
  await saving;
  expect(saver.dirty).toBe(false);
  const document = await f.database.documents.get(f.document.id);
  expect(document?.revision).toBe(2);
  expect(document?.content).toEqual(latest);
});
