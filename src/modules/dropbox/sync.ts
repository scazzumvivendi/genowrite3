import { t } from '../../i18n';
import { lockActiveEditor } from '../editor/active-editor';
import { db, readProject } from '../../database/db';
import { parseBackup, type ProjectBackup } from '../backup/backup';
import { safeFilename } from '../export/manuscript';
import { DropboxApiError } from './files';
import { readRemote, writeRemote } from './sync-remote';
import { mergeSnapshots, snapshotSignature } from './merge';

import {
  backupSnapshot,
  readSync,
  rememberRecovery,
  storeSync,
  writeSnapshot,
} from './sync-storage';
export { backupSnapshot, readSync, syncKey, disableSync } from './sync-storage';
export { resolveSync } from './sync-resolve';

export async function openSyncedProject(
  backup: ProjectBackup,
  path: string,
  database = db,
) {
  const snapshot = parseBackup(JSON.stringify(backup)).snapshot;
  const remote = await readRemote(path);
  if (remote.backup.snapshot.project.id !== snapshot.project.id) {
    throw new Error(t('sync.identityConflict'));
  }
  await database.transaction(
    'rw',
    [...database.projectTables, database.statistics, database.preferences],
    async () => {
      if (await database.projects.get(snapshot.project.id)) {
        throw new Error(t('sync.alreadyLocal'));
      }
      await writeSnapshot(remote.backup.snapshot, database);
      await storeSync(
        snapshot.project.id,
        {
          enabled: true,
          path: remote.file.id,
          base: remote.backup.snapshot,
          revision: remote.file.rev,
          status: 'synced',
        },
        database,
      );
    },
  );
  return snapshot.project.id;
}
export async function enableSync(
  id: string,
  flush: () => Promise<void>,
  database = db,
) {
  await flush();
  const previous = await readSync(id, database);
  if (previous.path && previous.base) {
    await storeSync(
      id,
      { ...previous, enabled: true, error: '', conflicts: [] },
      database,
    );
    return;
  }
  const snapshot = await readProject(database, id);
  if (snapshot.project.deletedAt) {
    throw new Error(t('sync.deleted'));
  }
  const path = `/${safeFilename(snapshot.project.title).slice(0, 100)}--${id}--current.genowrite3.json`;
  let remote;
  try {
    remote = await readRemote(path);
  } catch (reason) {
    if (
      !(reason instanceof DropboxApiError) ||
      reason.status !== 409 ||
      !reason.summary.startsWith('path/not_found')
    ) {
      throw reason;
    }
  }
  if (remote && remote.backup.snapshot.project.id !== id) {
    throw new Error(t('sync.identityConflict'));
  }
  if (
    remote &&
    snapshotSignature(remote.backup.snapshot) !== snapshotSignature(snapshot)
  ) {
    await storeSync(
      id,
      {
        enabled: false,
        path,
        status: 'conflict',
        remote: remote.backup,
        conflicts: ['/initial'],
        error: t('sync.noBase'),
      },
      database,
    );
    return;
  }
  const file =
    remote?.file ?? (await writeRemote(path, backupSnapshot(snapshot)));
  await storeSync(
    id,
    {
      enabled: true,
      path: file.id,
      revision: file.rev,
      base: remote?.backup.snapshot ?? snapshot,
      status: 'synced',
      checkedAt: new Date().toISOString(),
    },
    database,
  );
}

const running = new Set<string>();
async function tick(
  id: string,
  flush: () => Promise<void>,
  database = db,
  transport = { read: readRemote, write: writeRemote },
) {
  if (running.has(id)) {
    return;
  }
  running.add(id);
  try {
    const state = await readSync(id, database);
    if (!state.enabled || !state.path || !state.base) {
      return;
    }
    await flush();
    const local = await database.transaction('r', database.projectTables, () =>
      readProject(database, id),
    );
    if (local.project.deletedAt) {
      return;
    }
    const remote = await transport.read(state.path);
    if (remote.backup.snapshot.project.id !== id) {
      throw new Error(t('sync.identityConflict'));
    }
    const localChanged =
      snapshotSignature(local) !== snapshotSignature(state.base);
    const remoteChanged =
      snapshotSignature(remote.backup.snapshot) !==
      snapshotSignature(state.base);
    const status =
      localChanged && remoteChanged
        ? 'diverged'
        : localChanged
          ? 'local'
          : remoteChanged
            ? 'remote'
            : 'synced';
    if (!(await readSync(id, database)).enabled) {
      return;
    }
    await storeSync(
      id,
      { ...state, status, checkedAt: new Date().toISOString(), error: '' },
      database,
    );
    const merged = mergeSnapshots(state.base, local, remote.backup.snapshot);
    if (merged.conflicts.length) {
      await storeSync(
        id,
        {
          ...state,
          enabled: false,
          status: 'conflict',
          conflicts: merged.conflicts,
          remote: remote.backup,
          error: t('sync.conflict'),
        },
        database,
      );
      return;
    }
    await flush();
    if (
      snapshotSignature(await readProject(database, id)) !==
      snapshotSignature(local)
    ) {
      return;
    }
    const file =
      snapshotSignature(merged.snapshot) ===
      snapshotSignature(remote.backup.snapshot)
        ? remote.file
        : await transport.write(
            state.path,
            backupSnapshot(merged.snapshot),
            remote.file.rev,
          );
    const unlock = lockActiveEditor();
    try {
      await flush();
      await database.transaction(
        'rw',
        [...database.projectTables, database.statistics, database.preferences],
        async () => {
          const latestState = await readSync(id, database);
          if (!latestState.enabled) {
            return;
          }
          const latest = await readProject(database, id);
          if (snapshotSignature(latest) !== snapshotSignature(local)) {
            return;
          }
          if (snapshotSignature(merged.snapshot) !== snapshotSignature(local)) {
            await rememberRecovery(local, database);
            for (const document of merged.snapshot.documents) {
              const previous = local.documents.find(
                (item) => item.id === document.id,
              );
              document.revision = previous
                ? previous.revision +
                  (snapshotSignature(document.content) ===
                  snapshotSignature(previous.content)
                    ? 0
                    : 1)
                : document.revision;
            }
            await writeSnapshot(merged.snapshot, database);
          }
          await storeSync(
            id,
            {
              enabled: true,
              path: file.id,
              base: merged.snapshot,
              revision: file.rev,
              generation:
                snapshotSignature(merged.snapshot) !== snapshotSignature(local)
                  ? crypto.randomUUID()
                  : (state.generation ?? ''),
              status: 'synced',
              checkedAt: new Date().toISOString(),
              error: '',
            },
            database,
          );
        },
      );
    } finally {
      unlock();
    }
  } catch (reason) {
    const state = await readSync(id, database);
    await storeSync(
      id,
      {
        ...state,
        error: reason instanceof Error ? reason.message : String(reason),
      },
      database,
    );
  } finally {
    running.delete(id);
  }
}

export async function syncTick(...args: Parameters<typeof tick>) {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(
      `genowrite-sync:${args[2]?.name ?? db.name}:${args[0]}`,
      { ifAvailable: true },
      async (lock) => {
        if (lock) {
          await tick(...args);
        }
      },
    );
  }
  return tick(...args);
}
