import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GenowriteDatabase, readProject } from '../../database/db';
import { ProjectService } from '../storage/project-service';
import { automaticBackupTick, readAutomatic, setAutomatic } from './automatic';
import { dropboxToken } from './auth';
vi.mock('./auth', () => ({ dropboxToken: vi.fn(() => 'token') }));
let database: GenowriteDatabase;
let id: string;
beforeEach(async () => {
  vi.mocked(dropboxToken).mockReturnValue('token');
  database = new GenowriteDatabase(`automatic-${crypto.randomUUID()}`);
  id = await new ProjectService(database).createProject('Automatico');
});
afterEach(async () => {
  await database.delete();
});
const uploaded = { id: 'id:copy', name: 'copy', size: 0, server_modified: '' };
it('nessun invio senza consenso; invia solo modifiche dopo flush, includendo note e sinossi', async () => {
  const upload = vi.fn().mockResolvedValue(uploaded);
  const flush = vi.fn().mockResolvedValue(undefined);
  await automaticBackupTick(id, flush, database, upload);
  expect(flush).not.toHaveBeenCalled();
  await setAutomatic(id, true, database);
  await automaticBackupTick(id, flush, database, upload);
  await automaticBackupTick(id, flush, database, upload);
  expect(upload).toHaveBeenCalledTimes(1);
  expect((await readAutomatic(id, database)).lastSuccess).toBeTruthy();
  const service = new ProjectService(database);
  await service.addNode(id, null, 'chapter', 'Capitolo');
  await service.mutate(id, (snapshot) => {
    snapshot.nodes[0]!.synopsis = 'Sinossi completa';
  });
  await automaticBackupTick(id, flush, database, upload);
  expect(upload).toHaveBeenCalledTimes(2);
  expect(upload.mock.calls[1]![0]).toContain('Sinossi completa');
  expect((await readProject(database, id)).nodes).toHaveLength(1);
});
it('upload fallito e token scaduto mettono in pausa senza modificare il progetto', async () => {
  const upload = vi.fn().mockRejectedValue(new Error('Rete non disponibile'));
  await setAutomatic(id, true, database);
  await automaticBackupTick(id, async () => undefined, database, upload);
  expect(await readAutomatic(id, database)).toMatchObject({
    enabled: false,
    error: 'Rete non disponibile',
  });
  await automaticBackupTick(id, async () => undefined, database, upload);
  expect(upload).toHaveBeenCalledTimes(1);
  await setAutomatic(id, true, database);
  vi.mocked(dropboxToken).mockReturnValue(undefined);
  await automaticBackupTick(id, async () => undefined, database, upload);
  expect((await readAutomatic(id, database)).enabled).toBe(false);
  await expect(setAutomatic(id, true, database)).rejects.toThrow(
    'Collega Dropbox',
  );
  expect(await database.projects.count()).toBe(1);
});
it('flush fallito impedisce upload; cestino non viene inviato', async () => {
  const upload = vi.fn().mockResolvedValue(uploaded);
  await setAutomatic(id, true, database);
  await automaticBackupTick(
    id,
    async () => {
      throw new Error('Errore salvataggio');
    },
    database,
    upload,
  );
  expect(upload).not.toHaveBeenCalled();
  await setAutomatic(id, true, database);
  await new ProjectService(database).setProjectDeleted(id, true);
  await automaticBackupTick(id, async () => undefined, database, upload);
  expect(upload).not.toHaveBeenCalled();
});
it('niente upload sovrapposti; disattivare durante un invio non riattiva il backup', async () => {
  let finish!: () => void;
  let started!: () => void;
  const startedPromise = new Promise<void>((resolve) => {
    started = resolve;
  });
  const upload = vi.fn(async () => {
    started();
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    return uploaded;
  });
  await setAutomatic(id, true, database);
  const pending = automaticBackupTick(
    id,
    async () => undefined,
    database,
    upload,
  );
  await startedPromise;
  await automaticBackupTick(id, async () => undefined, database, upload);
  await setAutomatic(id, false, database);
  finish();
  await pending;
  expect(upload).toHaveBeenCalledTimes(1);
  expect((await readAutomatic(id, database)).enabled).toBe(false);
});
