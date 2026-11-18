import { t, locale } from '../../i18n';
import { groupBackups } from '../../modules/dropbox/groups';
import { useState } from 'react';
import {
  connectDropbox,
  disconnectDropbox,
  dropboxConnected,
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
  onImport?: (backup: ProjectBackup, file?: DropboxFile) => void;
}) {
  const [connected, setConnected] = useState(() => Boolean(dropboxConnected()));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [files, setFiles] = useState<DropboxFile[]>();
  const [groupId, setGroupId] = useState<string>();
  const groups = groupBackups(files ?? []);
  const group = groups.find((item) => item.id === groupId);
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
      setConnected(Boolean(dropboxConnected()));
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
          <p className="connection-status" role="status">
            {t('dropbox.connected')}
          </p>
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
              {group ? (
                <>
                  <button type="button" onClick={() => setGroupId(undefined)}>
                    {t('dropbox.back')}
                  </button>
                  <h3>{group.title}</h3>
                  <div className="backup-table-scroll">
                    <table className="backup-table">
                      <caption>{t('dropbox.versions')}</caption>
                      <thead>
                        <tr>
                          <th scope="col">{t('dropbox.date')}</th>
                          <th scope="col">{t('dropbox.size')}</th>
                          <th scope="col">{t('dropbox.file')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.files.map((file) => (
                          <tr key={file.id}>
                            <td>
                              {new Date(file.server_modified).toLocaleString(
                                locale,
                              )}
                            </td>
                            <td>
                              {Math.ceil(file.size / 1024)} {t('kb_550fde')}
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() =>
                                  void run(async () =>
                                    onImport(
                                      await downloadDropboxBackup(file),
                                      file,
                                    ),
                                  )
                                }
                              >
                                {file.name}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                files && (
                  <div
                    className="backup-projects"
                    aria-label={t('dropbox.projects')}
                  >
                    {groups.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setGroupId(item.id)}
                      >
                        {item.title}
                        <span>{item.files.length}</span>
                      </button>
                    ))}
                  </div>
                )
              )}
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
