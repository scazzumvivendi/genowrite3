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
            'Dropbox collegato. Apri Esporta oppure Ripristina backup per trasferire un progetto.',
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
    return <p role="status">Apertura Genowrite…</p>;
  }
  return (
    <>
      {message && (
        <div role="status">
          <p>{message}</p>
          <button onClick={() => setMessage('')}>
            Chiudi messaggio Dropbox
          </button>
        </div>
      )}
      {children}
    </>
  );
}
