import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { GenowriteDatabase, readProject } from '../../database/db';
import { ProjectService } from '../storage/project-service';
import { LibraryService } from './service';
import { duplicateNode } from '../manuscript/duplicate';
import { projectCounts } from '../statistics/counts';
import { searchProject } from './search';

it('duplica contenuto indipendente; conserva collegamenti dopo spostamento e cestino', async () => {
  const database = new GenowriteDatabase(`library-${crypto.randomUUID()}`);
  try {
    const projects = new ProjectService(database);
    const library = new LibraryService(projects);
    const id = await projects.createProject('Storia');
    const chapter = await projects.addNode(id, null, 'chapter', 'Primo');
    const snapshot = await readProject(database, id);
    await projects.saveDocument(
      snapshot.documents[0]!.id,
      {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Una città' }] },
        ],
      },
      0,
    );
    const reference = await library.saveReference(
      id,
      {
        kind: 'character',
        name: 'Elena',
        description: 'Abita nella città',
        notes: '',
        fields: {},
      },
      [chapter],
    );
    const note = await library.saveNote(id, {
      title: 'Ricerca',
      body: 'Molte parole escluse',
      kind: 'research',
      linkedNodeIds: [chapter],
      linkedReferenceIds: [reference],
    });
    const copy = await duplicateNode(id, chapter, projects);
    const after = await readProject(database, id);
    expect(after.documents).toHaveLength(2);
    expect(after.nodes.find((node) => node.id === copy)?.documentId).not.toBe(
      snapshot.documents[0]?.id,
    );
    expect(projectCounts(after, []).total.words).toBe(4);
    const linkId = after.relations[0]!.id;
    await library.saveReference(
      id,
      {
        kind: 'character',
        name: 'Elena',
        description: 'Aggiornata',
        notes: '',
        fields: {},
      },
      [chapter],
      reference,
    );
    expect((await readProject(database, id)).relations[0]!.id).toBe(linkId);
    await projects.moveNode(id, chapter, null, 1);
    expect((await readProject(database, id)).relations[0]?.targetId).toBe(
      chapter,
    );
    await library.saveReference(
      id,
      {
        kind: 'character',
        name: 'Elena',
        description: '',
        notes: '',
        fields: {},
      },
      [],
      reference,
    );
    expect((await readProject(database, id)).relations).toHaveLength(0);
    await library.setDeleted(id, 'note', note, true);
    expect(
      searchProject(await readProject(database, id), 'Molte parole'),
    ).toHaveLength(0);
    await library.setDeleted(id, 'note', note, false);
    expect(
      searchProject(await readProject(database, id), 'Molte parole')[0]?.id,
    ).toBe(note);
  } finally {
    await database.delete();
  }
});
