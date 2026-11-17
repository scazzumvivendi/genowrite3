import { t } from '../../i18n';
import { useEffect, useState, type ReactNode } from 'react';
import { finishDropboxAuth } from '../../modules/dropbox/auth';

export function DropboxAuthBoundary({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    let mounted = true;
    void finishDropboxAuth()
      .then((connected) => {
        if (mounted && connected) {
          setMessage(
            t(
              'dropbox_collegato_apri_esporta_oppure_ripristina_backup_per_trasf_1198f9',
            ),
          );
        }
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setMessage(reason instanceof Error ? reason.message : String(reason));
        }
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);
  if (!ready) {
    return <p role="status">{t('apertura_genowrite_7e8d1e')}</p>;
  }
  return (
    <>
      {message && (
        <div role="status">
          <p>{message}</p>
          <button onClick={() => setMessage('')}>
            {t('chiudi_messaggio_dropbox_59d283')}
          </button>
        </div>
      )}
      {children}
    </>
  );
}
