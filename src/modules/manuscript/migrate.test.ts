import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { expect, it } from 'vitest';
import { GenowriteDatabase, readProject } from '../../database/db';
import { ProjectService } from '../storage/project-service';
import { parseBackup, exportBackup } from '../backup/backup';
import { validateSnapshot } from './validation';

it('migra contenitori, collegamenti e cestino conservando documenti e ID; importa backup precedenti', async () => {
  const name = `structure-${crypto.randomUUID()}`;
  const source = new GenowriteDatabase(name);
  const service = new ProjectService(source);
  const projectId = await service.createProject('Romanzo');
  const chapterId = await service.addNode(
    projectId,
    null,
    'chapter',
    'Capitolo',
  );
  const snapshot = await readProject(source, projectId);
  const legacy = {
    ...snapshot.nodes[0]!,
    id: 'volume',
    type: 'volume' as const,
    synopsis: 'Sinossi volume',
  };
  Object.assign(legacy, { status: 'planned' });
  Object.assign(snapshot.nodes[0]!, { status: 'revised' });
  delete legacy.mode;
  delete legacy.documentId;
  snapshot.nodes[0]!.parentId = legacy.id;
  snapshot.nodes.push(legacy);
  snapshot.notes.push({
    id: 'note',
    projectId,
    title: 'Nota',
    body: 'Contenuto',
    kind: 'project_note',
    linkedNodeIds: ['volume'],
    linkedReferenceIds: [],
    createdAt: '',
    updatedAt: '',
  });
  snapshot.relations.push({
    id: 'relation',
    projectId,
    sourceType: 'node',
    sourceId: 'volume',
    targetType: 'node',
    targetId: chapterId,
    relationType: 'related_to',
  });
  const text = JSON.stringify({
    format: 'genowrite3',
    version: 1,
    exportedAt: '',
    snapshot,
  });
  const parsed = parseBackup(text).snapshot;
  validateSnapshot(parsed);
  expect(parsed.nodes.map((node) => node.id)).toEqual([chapterId]);
  expect(parsed.nodes[0]!.parentId).toBeNull();
  expect(parsed.nodes[0]).not.toHaveProperty('status');
  expect(parsed.notes.find((note) => note.id === 'volume')?.body).toContain(
    'Sinossi volume',
  );
  expect(
    parsed.notes.find((note) => note.id === 'note')?.linkedNodeIds,
  ).toEqual([chapterId]);
  expect(parsed.relations[0]?.sourceType).toBe('note');
  source.close();
  await source.delete();
  const old = new Dexie(name);
  old.version(2).stores({
    projects: 'id',
    nodes: 'id,projectId',
    documents: 'id,&ownerNodeId,projectId',
    notes: 'id,projectId',
    references: 'id,projectId',
    relations: 'id,projectId',
    projectSettings: 'projectId',
    preferences: 'id',
    statistics: 'id,projectId',
  });
  await old.table('projects').put(snapshot.project);
  await old.table('nodes').bulkPut(snapshot.nodes);
  await old.table('documents').bulkPut(snapshot.documents);
  await old.table('notes').bulkPut(snapshot.notes);
  await old.table('relations').bulkPut(snapshot.relations);
  old.close();
  const current = new GenowriteDatabase(name);
  try {
    await current.open();
    const migrated = await readProject(current, projectId);
    expect(migrated.nodes).toEqual(parsed.nodes);
    expect(migrated.documents).toEqual(snapshot.documents);
    expect(migrated.notes).toEqual(parsed.notes);
    expect(
      parseBackup(await exportBackup(current, projectId)).snapshot,
    ).toEqual(migrated);
  } finally {
    await current.delete();
  }
});
