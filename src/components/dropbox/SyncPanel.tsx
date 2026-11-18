import { useState } from 'react';
import { t, locale } from '../../i18n';
import { safeFilename } from '../../modules/export/manuscript';
import { db } from '../../database/db';
import { useLocalQuery } from '../../hooks/useLocalQuery';
import {
  disableSync,
  enableSync,
  readSync,
  syncTick,
  resolveSync,
} from '../../modules/dropbox/sync';
import { BackupPreview } from '../export/RestoreDialog';
import type { ProjectBackup } from '../../modules/backup/backup';
import { download } from '../../modules/export/download';

export function SyncPanel({
  projectId,
  flush,
  onRestored,
}: {
  projectId: string;
  flush: () => Promise<void>;
  onRestored: (id: string) => void;
}) {
  const query = useLocalQuery(() => readSync(projectId), [projectId]);
  const recovery = useLocalQuery(
    () =>
      db.preferences
        .where('id')
        .startsWith(`sync-recovery:${projectId}:`)
        .toArray(),
    [projectId],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  const state = query.value;
  const label =
    state?.error && state.status !== 'conflict'
      ? t('sync.unchecked')
      : state?.status === 'conflict'
        ? t('sync.conflict')
        : state?.status === 'local'
          ? t('sync.local')
          : state?.status === 'remote'
            ? t('sync.remote')
            : state?.status === 'diverged'
              ? t('sync.diverged')
              : state?.enabled
                ? t('sync.synced')
                : t('sync.off');
  return (
    <section>
      <fieldset disabled={busy}>
        <legend>{t('sync.title')}</legend>
        <p>{t('sync.explanation')}</p>
        <p role="status">{label}</p>
        <button
          onClick={() =>
            void run(async () => {
              if (state?.enabled) {
                await disableSync(projectId);
              } else {
                await enableSync(projectId, flush);
              }
            })
          }
        >
          {state?.enabled ? t('sync.disable') : t('sync.enable')}
        </button>
        <button
          disabled={!state?.enabled}
          onClick={() => void run(() => syncTick(projectId, flush))}
        >
          {t('sync.check')}
        </button>
        {(error || query.error || state?.error) && (
          <p role="alert">{error || query.error || state?.error}</p>
        )}
      </fieldset>
      {state?.remote && (
        <div className="dialog-actions">
          {(['local', 'remote'] as const).map((side) => (
            <button
              key={side}
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    side === 'local'
                      ? t('sync.confirmLocal')
                      : t('sync.confirmRemote'),
                  )
                ) {
                  void run(() => resolveSync(projectId, side, flush));
                }
              }}
            >
              {side === 'local' ? t('sync.useLocal') : t('sync.useRemote')}
            </button>
          ))}
        </div>
      )}
      {state?.remote && (
        <section>
          <h2>{t('sync.remoteCopy')}</h2>
          <BackupPreview backup={state.remote} onRestored={onRestored} />
        </section>
      )}
      {!!recovery.value?.length && (
        <details>
          <summary>{t('sync.recovery')}</summary>
          <div className="backup-table-scroll">
            <table className="backup-table">
              <thead>
                <tr>
                  <th scope="col">{t('dropbox.date')}</th>
                  <th scope="col">{t('sync.source')}</th>
                  <th scope="col">{t('dropbox.file')}</th>
                </tr>
              </thead>
              <tbody>
                {recovery.value.map((item) => {
                  const backup = item.value as ProjectBackup & {
                    recoverySource?: string;
                  };
                  const name = `${safeFilename(backup.snapshot.project.title)}-${backup.exportedAt.replace(/[:.]/gu, '-')}-${item.id.slice(-8)}-recupero.genowrite3.json`;
                  return (
                    <tr key={item.id}>
                      <td>
                        {new Date(backup.exportedAt).toLocaleString(locale)}
                      </td>
                      <td>
                        {backup.recoverySource === 'remote'
                          ? t('dropbox_4750d0')
                          : t('sync.thisDevice')}
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            download(
                              new Blob([JSON.stringify(backup)], {
                                type: 'application/json',
                              }),
                              name,
                            )
                          }
                        >
                          {t('sync.downloadRecovery')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
