import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { GenowriteDatabase, readProject } from '../../database/db';
import { ProjectService } from '../storage/project-service';
import { exportBackup, parseBackup, restoreBackup } from './backup';

it('backup completo, importazioni ripetute senza collisioni e nessuna scrittura parziale', async () => {
  const database = new GenowriteDatabase(`backup-${crypto.randomUUID()}`);
  try {
    const service = new ProjectService(database);
    const id = await service.createProject('Titolo italiano');
    await service.addNode(id, null, 'chapter', 'Primo');
    const backup = parseBackup(await exportBackup(database, id));
    const first = await restoreBackup(database, backup);
    const second = await restoreBackup(database, backup);
    expect(new Set([id, first, second]).size).toBe(3);
    expect((await readProject(database, first)).documents[0]?.content).toEqual(
      backup.snapshot.documents[0]?.content,
    );
    expect((await readProject(database, first)).nodes[0]?.id).not.toBe(
      backup.snapshot.nodes[0]?.id,
    );
    const broken = structuredClone(backup);
    broken.snapshot.nodes[0]!.parentId = 'missing';
    await expect(restoreBackup(database, broken)).rejects.toThrow();
    expect(await database.projects.count()).toBe(3);
    expect(() =>
      parseBackup('{"format":"genowrite3","version":999}'),
    ).toThrow();
  } finally {
    await database.delete();
  }
});
