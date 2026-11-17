import { t, locale } from '../../i18n';
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
      <legend>{t('dropbox_4750d0')}</legend>
      <p>
        {t(
          'trasferisci_una_copia_completa_del_progetto_solo_quando_lo_richie_74b582',
        )}
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
          {t('collega_dropbox_ad3d59')}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              disconnectDropbox();
              setConnected(false);
              setFiles(undefined);
              setMessage(t('dropbox_scollegato_da_questa_scheda_766836'));
            }}
          >
            {t('scollega_dropbox_aec7f9')}
          </button>
          {prepareExport && (
            <button
              type="button"
              onClick={() =>
                void run(async () => {
                  const file = await uploadDropboxBackup(await prepareExport());
                  setMessage(
                    t('backup_esportato_su_dropbox_value0_e28af7', {
                      value0: file.name,
                    }),
                  );
                })
              }
            >
              {t('esporta_su_dropbox_ba3d4f')}
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
                {t('mostra_backup_dropbox_1cdc7b')}
              </button>
              {files?.length === 0 && (
                <p>
                  {t(
                    'nessun_backup_genowrite_3_nella_cartella_dell_app_dropbox_1c4a0f',
                  )}
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
                      {new Date(file.server_modified).toLocaleString(
                        locale,
                      )} · {Math.ceil(file.size / 1024)}
                      {t('kb_550fde')}
                    </small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {busy && <p role="status">{t('operazione_dropbox_in_corso_8dfe81')}</p>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}
