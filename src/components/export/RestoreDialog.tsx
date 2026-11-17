import { t } from '../../i18n';
import { DropboxPanel } from '../dropbox/DropboxPanel';
import { useState } from 'react';
import { db } from '../../database/db';
import {
  parseBackup,
  restoreBackup,
  type ProjectBackup,
} from '../../modules/backup/backup';
import { Modal } from '../common/Modal';

export function RestoreDialog({
  onClose,
  onRestored,
}: {
  onClose: () => void;
  onRestored: (id: string) => void;
}) {
  const [backup, setBackup] = useState<ProjectBackup>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function read(file: File | undefined) {
    try {
      if (!file) {
        return;
      }
      if (file.size > 100_000_000) {
        throw new Error(t('il_backup_supera_100_mb_f34da0'));
      }
      setBackup(parseBackup(await file.text()));
      setError('');
    } catch (reason) {
      setBackup(undefined);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  return (
    <Modal
      title={t('ripristina_backup_json_5ffabd')}
      onClose={onClose}
      protectContent={false}
    >
      <DropboxPanel
        onImport={(value) => {
          setBackup(value);
          setError('');
        }}
      />
      <label>
        {t('file_di_backup_0249db')}
        <input
          type="file"
          accept=".json,application/json"
          onChange={(event) => void read(event.target.files?.[0])}
        />
      </label>
      {backup && (
        <>
          <h3>{backup.snapshot.project.title}</h3>
          <p>
            {t('restore.summary', {
              nodes: backup.snapshot.nodes.length,
              documents: backup.snapshot.documents.length,
              references: backup.snapshot.references.length,
              notes: backup.snapshot.notes.length,
            })}
          </p>
          <p>
            {t(
              'verra_creato_un_nuovo_progetto_con_identificatori_indipendenti_ne_3f1a7f',
            )}
          </p>
          <button
            className="filled-button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void restoreBackup(db, backup)
                .then(onRestored)
                .catch((reason: unknown) => setError(String(reason)))
                .finally(() => setBusy(false));
            }}
          >
            {t('ripristina_come_nuovo_progetto_c6862b')}
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  );
}
