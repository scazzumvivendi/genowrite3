import { useState } from 'react';
import {
  connectDropbox,
  disconnectDropbox,
  dropboxToken,
} from '../../modules/dropbox/auth';
import {
  downloadDropboxBackup,
  listDropboxBackups,
  uploadDropboxBackup,
  type DropboxFile,
} from '../../modules/dropbox/files';
import type { ProjectBackup } from '../../modules/backup/backup';

export function DropboxPanel({
  prepareExport,
  onImport,
}: {
  prepareExport?: () => Promise<string>;
  onImport?: (backup: ProjectBackup) => void;
}) {
  const [connected, setConnected] = useState(() => Boolean(dropboxToken()));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [files, setFiles] = useState<DropboxFile[]>();
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
      setConnected(Boolean(dropboxToken()));
    }
  }
  return (
    <fieldset disabled={busy}>
      <legend>Dropbox</legend>
      <p>
        Trasferisci una copia completa del progetto solo quando lo richiedi.
        Ogni esportazione crea un nuovo backup; l’importazione crea un nuovo
        progetto.
      </p>
      {!connected ? (
        <button
          type="button"
          onClick={() =>
            void run(async () => {
              // Prima di lasciare la pagina, salvare eventuali modifiche dell’editor.
              if (prepareExport) {
                await prepareExport();
              }
              await connectDropbox();
            })
          }
        >
          Collega Dropbox
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              disconnectDropbox();
              setConnected(false);
              setFiles(undefined);
              setMessage('Dropbox scollegato da questa scheda.');
            }}
          >
            Scollega Dropbox
          </button>
          {prepareExport && (
            <button
              type="button"
              onClick={() =>
                void run(async () => {
                  const file = await uploadDropboxBackup(await prepareExport());
                  setMessage(`Backup esportato su Dropbox: ${file.name}`);
                })
              }
            >
              Esporta su Dropbox
            </button>
          )}
          {onImport && (
            <>
              <button
                type="button"
                onClick={() =>
                  void run(async () => {
                    setFiles(await listDropboxBackups());
                  })
                }
              >
                Mostra backup Dropbox
              </button>
              {files?.length === 0 && (
                <p>
                  Nessun backup Genowrite 3 nella cartella dell’app Dropbox.
                </p>
              )}
              <ul>
                {files?.map((file) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      onClick={() =>
                        void run(async () => {
                          onImport(await downloadDropboxBackup(file));
                        })
                      }
                    >
                      {file.name}
                    </button>
                    <small>
                      {' '}
                      {new Date(file.server_modified).toLocaleString()} ·{' '}
                      {Math.ceil(file.size / 1024)} KB
                    </small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {busy && <p role="status">Operazione Dropbox in corso…</p>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
