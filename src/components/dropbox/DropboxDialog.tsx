import { t, locale } from '../../i18n';
import { useState } from 'react';
import { Modal } from '../common/Modal';
import { DropboxPanel } from './DropboxPanel';
import { db } from '../../database/db';
import { exportBackup } from '../../modules/backup/backup';
import { useLocalQuery } from '../../hooks/useLocalQuery';
import { readAutomatic, setAutomatic } from '../../modules/dropbox/automatic';

export function DropboxDialog({
  projectId,
  flush,
  onClose,
}: {
  projectId: string;
  flush: () => Promise<void>;
  onClose: () => void;
}) {
  const query = useLocalQuery(() => readAutomatic(projectId), [projectId]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={t('backup_dropbox_59f66f')}
      onClose={onClose}
      protectContent={false}
    >
      <DropboxPanel
        prepareExport={async () => {
          await flush();
          return exportBackup(db, projectId);
        }}
      />
      <fieldset disabled={busy || !query.value}>
        <legend>{t('backup_periodico_di_questo_progetto_3ea886')}</legend>
        <p>
          {t(
            'ogni_minuto_mentre_il_progetto_e_aperto_e_la_scheda_e_visibile_in_a887a7',
          )}
        </p>
        <button
          type="button"
          aria-pressed={query.value?.enabled ?? false}
          onClick={() => {
            setBusy(true);
            setError('');
            void setAutomatic(projectId, !query.value?.enabled)
              .catch((reason: unknown) =>
                setError(
                  reason instanceof Error ? reason.message : String(reason),
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          {query.value?.enabled
            ? t('disattiva_backup_automatico_7556b2')
            : t('attiva_backup_automatico_ee005a')}
        </button>
        <p role="status">
          {query.value?.enabled
            ? t('backup_automatico_attivo_ogni_minuto_99aa8f')
            : t('backup_automatico_disattivato_0abdde')}
        </p>
        {query.value?.lastSuccess && (
          <p>
            {t('dropbox.lastAutomatic', {
              date: new Date(query.value.lastSuccess).toLocaleString(locale),
            })}
          </p>
        )}
        {query.value?.error && (
          <p role="alert">
            {t('dropbox.automaticPaused', { reason: query.value.error })}
          </p>
        )}
      </fieldset>
      {(error || query.error) && <p role="alert">{error || query.error}</p>}
    </Modal>
  );
}
