import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { GenowriteDatabase, readProject } from '../../database/db';
import { ProjectService } from '../storage/project-service';
import { mergeSnapshots, snapshotSignature } from './merge';
import { backupSnapshot, readSync, syncKey, syncTick } from './sync';
import type { ProjectSnapshot } from '../manuscript/model';

const databases: GenowriteDatabase[] = [];
afterEach(async () => {
  for (const database of databases.splice(0)) {
    await database.delete();
  }
});
async function fixture() {
  const database = new GenowriteDatabase(`sync-${crypto.randomUUID()}`);
  databases.push(database);
  const service = new ProjectService(database);
  const id = await service.createProject('Romanzo');
  await service.addNode(id, null, 'chapter', 'Uno');
  const base = await readProject(database, id);
  base.documents[0]!.content = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'La casa era vuota.' }],
      },
    ],
  };
  await database.documents.put(base.documents[0]!);
  await database.preferences.put({
    id: syncKey(id),
    value: { enabled: true, path: 'id:remote', base },
  });
  return { database, id, base, service };
}
function text(snapshot: ProjectSnapshot, value?: string) {
  const node = snapshot.documents[0]!.content.content![0]!.content![0]!;
  if (value !== undefined) {
    node.text = value;
  }
  return node.text;
}
const file = {
  id: 'id:remote',
  name: 'remote',
  size: 1000,
  server_modified: '',
  rev: 'revision',
};
it('unisce modifiche separate nello stesso testo e nella sinossi, conservando formattazione', async () => {
  const { base } = await fixture();
  const local = structuredClone(base),
    remote = structuredClone(base);
  text(local, 'La grande casa era vuota.');
  text(remote, 'La casa era silenziosa.');
  remote.nodes[0]!.synopsis = 'Sinossi remota';
  const result = mergeSnapshots(base, local, remote);
  expect(result.conflicts).toEqual([]);
  expect(text(result.snapshot)).toBe('La grande casa era silenziosa.');
  expect(result.snapshot.nodes[0]?.synopsis).toBe('Sinossi remota');
  local.documents[0]!.content.content![0]!.content![0]!.marks = [
    { type: 'bold' },
  ];
  expect(
    mergeSnapshots(base, local, remote).snapshot.documents[0]!.content
      .content![0]!.content![0]!.marks,
  ).toEqual([{ type: 'bold' }]);
});
it('modifiche sovrapposte sospendono la sync senza modificare locale o remoto', async () => {
  const { database, id, base } = await fixture();
  const local = structuredClone(base),
    remote = structuredClone(base);
  text(local, 'La casa era piena.');
  text(remote, 'La casa era rossa.');
  await database.documents.put(local.documents[0]!);
  const write = vi.fn();
  await syncTick(id, async () => undefined, database, {
    read: async () => ({ backup: backupSnapshot(remote), file }),
    write,
  });
  expect(write).not.toHaveBeenCalled();
  expect(text(await readProject(database, id))).toBe('La casa era piena.');
  const state = await readSync(id, database);
  expect(state.enabled).toBe(false);
  expect(state.status).toBe('conflict');
  expect(text(state.remote!.snapshot)).toBe('La casa era rossa.');
});
it('riceve remoto atomicamente, salva recupero e incrementa revisione del testo', async () => {
  const { database, id, base } = await fixture();
  const remote = structuredClone(base);
  text(remote, 'Testo remoto');
  await syncTick(id, async () => undefined, database, {
    read: async () => ({ backup: backupSnapshot(remote), file }),
    write: vi.fn(),
  });
  const result = await readProject(database, id);
  expect(text(result)).toBe('Testo remoto');
  expect(result.documents[0]!.revision).toBe(1);
  expect((await readSync(id, database)).generation).toBeTruthy();
  const recovery = await database.preferences
    .where('id')
    .startsWith(`sync-recovery:${id}:`)
    .toArray();
  expect(recovery).toHaveLength(1);
  expect(
    text((recovery[0]!.value as ReturnType<typeof backupSnapshot>).snapshot),
  ).toBe('La casa era vuota.');
});
it('una modifica durante la rete impedisce applicazione e sovrascrittura della bozza', async () => {
  const { database, id, base } = await fixture();
  const remote = structuredClone(base);
  remote.nodes[0]!.synopsis = 'Remota';
  const write = vi.fn();
  await syncTick(id, async () => undefined, database, {
    read: async () => {
      const next = structuredClone(base.documents[0]!);
      next.content = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Nuova bozza' }],
          },
        ],
      };
      await database.documents.put(next);
      return { backup: backupSnapshot(remote), file };
    },
    write,
  });
  expect(text(await readProject(database, id))).toBe('Nuova bozza');
  expect(write).not.toHaveBeenCalled();
});
it('conflitto CAS o rete incerta non modifica locale o base comune', async () => {
  const { database, id, base } = await fixture();
  const local = structuredClone(base);
  text(local, 'Modifica locale');
  await database.documents.put(local.documents[0]!);
  await syncTick(id, async () => undefined, database, {
    read: async () => ({ backup: backupSnapshot(base), file }),
    write: async () => {
      throw new Error('CAS');
    },
  });
  expect(text(await readProject(database, id))).toBe('Modifica locale');
  expect(snapshotSignature((await readSync(id, database)).base)).toBe(
    snapshotSignature(base),
  );
  expect((await readSync(id, database)).error).toBe('CAS');
});
it('non ignora campi utente chiamati revision o updatedAt', async () => {
  const { base } = await fixture();
  const local = structuredClone(base),
    remote = structuredClone(base);
  local.settings.id = 'campo utente';
  remote.settings.id = 'campo utente';
  local.settings.revision = 'locale';
  remote.settings.updatedAt = 'remoto';
  const merged = mergeSnapshots(base, local, remote);
  expect(merged.conflicts).toEqual([]);
  expect(merged.snapshot.settings).toEqual({
    id: 'campo utente',
    revision: 'locale',
    updatedAt: 'remoto',
  });
});
