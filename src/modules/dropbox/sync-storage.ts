import { t } from '../../i18n';
import { db, type GenowriteDatabase } from '../../database/db';
import type { ProjectSnapshot } from '../manuscript/model';
import type { ProjectBackup } from '../backup/backup';

export interface SyncState {
  enabled: boolean;
  path?: string;
  base?: ProjectSnapshot;
  revision?: string;
  status?: 'synced' | 'local' | 'remote' | 'diverged' | 'conflict';
  checkedAt?: string;
  error?: string;
  conflicts?: string[];
  remote?: ProjectBackup;
  generation?: string;
}
export const syncKey = (id: string) => `dropbox-sync:${id}`;
export const backupSnapshot = (snapshot: ProjectSnapshot): ProjectBackup => ({
  format: 'genowrite3',
  version: 2,
  exportedAt: new Date().toISOString(),
  snapshot,
});
export async function readSync(id: string, database = db): Promise<SyncState> {
  return (
    ((await database.preferences.get(syncKey(id)))?.value as SyncState) ?? {
      enabled: false,
    }
  );
}
export async function storeSync(
  id: string,
  state: SyncState,
  database: GenowriteDatabase,
) {
  await database.preferences.put({ id: syncKey(id), value: state });
}
export async function disableSync(id: string, database = db) {
  await storeSync(
    id,
    { ...(await readSync(id, database)), enabled: false },
    database,
  );
}
export async function rememberRecovery(
  snapshot: ProjectSnapshot,
  database: GenowriteDatabase,
  source: 'local' | 'remote' = 'local',
) {
  await database.preferences.add({
    id: `sync-recovery:${snapshot.project.id}:${crypto.randomUUID()}`,
    value: { ...backupSnapshot(snapshot), recoverySource: source },
  });
}
export async function writeSnapshot(
  snapshot: ProjectSnapshot,
  database: GenowriteDatabase,
) {
  // A remote file must never overwrite an unrelated project's IDs.
  for (const [table, rows] of [
    [database.nodes, snapshot.nodes],
    [database.documents, snapshot.documents],
    [database.references, snapshot.references],
    [database.notes, snapshot.notes],
    [database.relations, snapshot.relations],
  ] as const) {
    for (const row of rows) {
      const previous = await table.get(row.id);
      if (previous && previous.projectId !== snapshot.project.id) {
        throw new Error(t('sync.identityConflict'));
      }
    }
  }
  const id = snapshot.project.id;
  await database.projects.put(snapshot.project);
  await database.nodes.where('projectId').equals(id).delete();
  await database.documents.where('projectId').equals(id).delete();
  await database.references.where('projectId').equals(id).delete();
  await database.notes.where('projectId').equals(id).delete();
  await database.relations.where('projectId').equals(id).delete();
  await database.nodes.bulkPut(snapshot.nodes);
  await database.documents.bulkPut(snapshot.documents);
  await database.references.bulkPut(snapshot.references);
  await database.notes.bulkPut(snapshot.notes);
  await database.relations.bulkPut(snapshot.relations);
  await database.projectSettings.put({
    projectId: id,
    values: snapshot.settings,
  });
  await database.statistics.where('projectId').equals(id).delete();
}
