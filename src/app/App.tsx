import { DropboxAuthBoundary } from '../components/dropbox/DropboxAuthBoundary';
import { PwaBoundary } from './pwa/PwaBoundary';
import { lazy, Suspense } from 'react';
const LocalWorkspace = lazy(() =>
  import('./LocalWorkspace').then((module) => ({
    default: module.LocalWorkspace,
  })),
);

export function App() {
  return (
    <PwaBoundary>
      <Suspense fallback={<p role="status">Apertura Genowrite…</p>}>
        <DropboxAuthBoundary>
          <LocalWorkspace />
        </DropboxAuthBoundary>
      </Suspense>
    </PwaBoundary>
  );
}
