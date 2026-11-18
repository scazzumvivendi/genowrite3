import { t } from '../../i18n';
import type { DropboxFile } from '../../modules/dropbox/files';
import { openSyncedProject } from '../../modules/dropbox/sync';
import { DropboxPanel } from '../dropbox/DropboxPanel';
import { useState } from 'react';
import { db } from '../../database/db';
import {
  parseBackup,
  restoreBackup,
  type ProjectBackup,
} from '../../modules/backup/backup';
import { Screen } from '../common/Screen';

export function RestoreDialog({
  onClose,
  onRestored,
}: {
  onClose: () => void;
  onRestored: (id: string) => void;
}) {
  const [backup, setBackup] = useState<ProjectBackup>();
  const [remoteFile, setRemoteFile] = useState<DropboxFile>();
  const [error, setError] = useState('');
  async function read(file: File | undefined) {
    try {
      if (!file) {
        return;
      }
      if (file.size > 100_000_000) {
        throw new Error(t('il_backup_supera_100_mb_f34da0'));
      }
      setRemoteFile(undefined);
      setBackup(parseBackup(await file.text()));
      setError('');
    } catch (reason) {
      setBackup(undefined);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  return (
    <Screen title={t('ripristina_backup_json_5ffabd')} onClose={onClose}>
      <DropboxPanel
        onImport={(value, file) => {
          setRemoteFile(file);
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
        <BackupPreview
          backup={backup}
          onRestored={onRestored}
          {...(remoteFile ? { remoteFile } : {})}
        />
      )}
      {error && <p role="alert">{error}</p>}
    </Screen>
  );
}

export function BackupPreview({
  backup,
  onRestored,
  remoteFile,
}: {
  remoteFile?: DropboxFile;
  backup: ProjectBackup;
  onRestored: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <section aria-label={backup.snapshot.project.title}>
      {remoteFile?.name.endsWith('--current.genowrite3.json') && (
        <button
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void openSyncedProject(backup, remoteFile.id)
              .then(onRestored)
              .catch((reason: unknown) => setError(String(reason)))
              .finally(() => setBusy(false));
          }}
        >
          {t('sync.open')}
        </button>
      )}
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
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
