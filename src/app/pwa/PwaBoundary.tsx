import { useEffect, useState, type ReactNode } from 'react';
import { flushActive } from './flush-active';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function PwaBoundary({ children }: { children: ReactNode }) {
  const [waiting, setWaiting] = useState<ServiceWorker>();
  const [install, setInstall] = useState<InstallPrompt>();
  const [error, setError] = useState('');
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      return;
    }
    let disposed = false;
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .then((registration) => {
        if (disposed) {
          return;
        }
        if (registration.waiting) {
          setWaiting(registration.waiting);
        }
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (
              worker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              !disposed
            ) {
              setWaiting(registration.waiting ?? worker);
            }
          });
        });
      })
      .catch((reason: unknown) =>
        setError(`Cache offline non disponibile: ${String(reason)}`),
      );
    function prompt(event: Event) {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    }
    window.addEventListener('beforeinstallprompt', prompt);
    return () => {
      disposed = true;
      window.removeEventListener('beforeinstallprompt', prompt);
    };
  }, []);
  async function update() {
    try {
      await flushActive();
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => window.location.reload(),
        { once: true },
      );
      waiting?.postMessage('ACTIVATE_UPDATE');
    } catch (reason) {
      setError(`Aggiornamento sospeso: ${String(reason)}`);
    }
  }
  return (
    <>
      {children}
      {(waiting || install || error) && (
        <div
          className="pwa-notice"
          aria-label="Installazione e aggiornamenti"
          role="region"
        >
          {error && <p role="alert">{error}</p>}
          {waiting && (
            <>
              <span>È disponibile una nuova versione.</span>
              <button onClick={() => void update()}>Salva e aggiorna</button>
            </>
          )}
          {install && (
            <button
              onClick={() =>
                void install.prompt().then(() => setInstall(undefined))
              }
            >
              Installa Genowrite
            </button>
          )}
        </div>
      )}
    </>
  );
}
