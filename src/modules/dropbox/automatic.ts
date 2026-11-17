import { t } from '../../i18n';
import { db, type GenowriteDatabase } from '../../database/db';
import { exportBackup, parseBackup } from '../backup/backup';
import { dropboxToken } from './auth';
import { uploadDropboxBackup } from './files';

export interface AutomaticBackup {
  enabled: boolean;
  lastDigest?: string;
  lastSuccess?: string;
  error?: string;
}
export const automaticKey = (projectId: string) => `dropbox-auto:${projectId}`;
export async function readAutomatic(
  projectId: string,
  database = db,
): Promise<AutomaticBackup> {
  return (
    ((await database.preferences.get(automaticKey(projectId)))?.value as
      AutomaticBackup | undefined) ?? { enabled: false }
  );
}
export async function setAutomatic(
  projectId: string,
  enabled: boolean,
  database = db,
) {
  if (enabled && !dropboxToken()) {
    throw new Error(
      t('collega_dropbox_prima_di_attivare_il_backup_automatico_66091b'),
    );
  }
  const previous = await readAutomatic(projectId, database);
  await database.preferences.put({
    id: automaticKey(projectId),
    value: { ...previous, enabled, error: '' },
  });
}

// Una singola operazione in volo per progetto anche con rimontaggi React.
const running = new Set<string>();
export async function automaticBackupTick(
  projectId: string,
  flush: () => Promise<void>,
  database: GenowriteDatabase = db,
  upload = uploadDropboxBackup,
) {
  if (running.has(projectId)) {
    return;
  }
  running.add(projectId);
  try {
    const state = await readAutomatic(projectId, database);
    if (!state.enabled) {
      return;
    }
    const project = await database.projects.get(projectId);
    if (!project || project.deletedAt) {
      return;
    }
    if (!dropboxToken()) {
      throw new Error(
        t(
          'collega_nuovamente_dropbox_per_riprendere_il_backup_automatico_79ee1d',
        ),
      );
    }
    await flush();
    const text = await exportBackup(database, projectId);
    const snapshot = JSON.stringify(parseBackup(text).snapshot);
    const digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(snapshot),
        ),
      ),
      (byte) => byte.toString(16).padStart(2, '0'),
    ).join('');
    const latest = await readAutomatic(projectId, database);
    if (!latest.enabled || digest === latest.lastDigest) {
      return;
    }
    await upload(text);
    // Un utente può disattivare durante l’upload: non riattivare l’opzione.
    const after = await readAutomatic(projectId, database);
    await database.preferences.put({
      id: automaticKey(projectId),
      value: {
        ...after,
        lastDigest: digest,
        lastSuccess: new Date().toISOString(),
        error: '',
      },
    });
  } catch (reason) {
    const state = await readAutomatic(projectId, database);
    await database.preferences.put({
      id: automaticKey(projectId),
      value: {
        ...state,
        enabled: false,
        error: reason instanceof Error ? reason.message : String(reason),
      },
    });
  } finally {
    running.delete(projectId);
  }
}
