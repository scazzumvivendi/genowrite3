import { t } from '../../i18n';
import { db, readProject } from '../../database/db';
import { lockActiveEditor } from '../editor/active-editor';
import { readRemote, writeRemote } from './sync-remote';
import { snapshotSignature } from './merge';
import {
  backupSnapshot,
  readSync,
  rememberRecovery,
  storeSync,
  writeSnapshot,
} from './sync-storage';

export async function resolveSync(
  id: string,
  side: 'local' | 'remote',
  flush: () => Promise<void>,
  database = db,
) {
  const state = await readSync(id, database);
  if (!state.path || !state.remote) {
    throw new Error(t('sync.conflict'));
  }
  const remote = await readRemote(state.path);
  if (remote.backup.snapshot.project.id !== id) {
    throw new Error(t('sync.identityConflict'));
  }
  if (
    snapshotSignature(remote.backup.snapshot) !==
    snapshotSignature(state.remote.snapshot)
  ) {
    await storeSync(
      id,
      { ...state, remote: remote.backup, error: t('sync.changedAgain') },
      database,
    );
    return;
  }
  const unlock = lockActiveEditor();
  try {
    await flush();
    const local = await readProject(database, id);
    const chosen = side === 'local' ? local : remote.backup.snapshot;
    await rememberRecovery(local, database);
    await rememberRecovery(remote.backup.snapshot, database, 'remote');
    const file =
      side === 'local'
        ? await writeRemote(state.path, backupSnapshot(chosen), remote.file.rev)
        : remote.file;
    await database.transaction(
      'rw',
      [...database.projectTables, database.statistics, database.preferences],
      async () => {
        if (
          snapshotSignature(await readProject(database, id)) !==
          snapshotSignature(local)
        ) {
          throw new Error(t('sync.changedAgain'));
        }
        if (side === 'remote') {
          for (const document of chosen.documents) {
            const previous = local.documents.find(
              (item) => item.id === document.id,
            );
            document.revision = previous
              ? previous.revision + 1
              : document.revision;
          }
          await writeSnapshot(chosen, database);
        }
        await storeSync(
          id,
          {
            enabled: true,
            path: file.id,
            base: chosen,
            revision: file.rev,
            generation: crypto.randomUUID(),
            status: 'synced',
            checkedAt: new Date().toISOString(),
          },
          database,
        );
      },
    );
  } finally {
    unlock();
  }
}
