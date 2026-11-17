import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { expect, it } from 'vitest';
import { GenowriteDatabase } from '../../database/db';
import { rebuildStatistics } from './cache';

it('migra v1 senza perdere testo e ricostruisce una cache corrotta', async () => {
  const name = `migration-${crypto.randomUUID()}`;
  const old = new Dexie(name);
  old.version(1).stores({
    projects: 'id, updatedAt, deletedAt',
    nodes: 'id, projectId, parentId, type, order, deletedAt',
    documents: 'id, &ownerNodeId, projectId',
    references: 'id, projectId, kind',
    notes: 'id, projectId',
    relations: 'id, projectId, sourceId, targetId',
    projectSettings: 'projectId',
    preferences: 'id',
  });
  await old.table('documents').add({
    id: 'document',
    projectId: 'project',
    ownerNodeId: 'chapter',
    revision: 1,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Due parole' }],
        },
      ],
    },
  });
  old.close();
  const current = new GenowriteDatabase(name);
  try {
    await current.open();
    expect((await current.statistics.get('document'))?.words).toBe(2);
    await current.statistics.update('document', { words: 999 });
    await rebuildStatistics('project', current);
    expect((await current.statistics.get('document'))?.words).toBe(2);
    expect(
      (await current.documents.get('document'))?.content.content?.[0]
        ?.content?.[0]?.text,
    ).toBe('Due parole');
  } finally {
    await current.delete();
  }
});
