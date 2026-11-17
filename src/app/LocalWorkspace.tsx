import { useState } from 'react';
import { db, readProject } from '../database/db';
import { useLocalQuery } from '../hooks/useLocalQuery';
import {
  readPreferences,
  type Preferences,
} from '../modules/settings/preferences';
import { ProjectChooser } from '../components/layout/ProjectChooser';
import { ProjectSession } from './ProjectSession';
import './workspace.css';
import './styles/product.css';

async function readArchive() {
  return {
    projects: await db.projects.toArray(),
    preferences: await readPreferences(),
    session: await db.preferences.get('session'),
  };
}
export function LocalWorkspace() {
  const boot = useLocalQuery(readArchive, []);
  if (boot.error && !boot.value) {
    return (
      <div className="theme">
        <main className="storage-error">
          <h1>Impossibile aprire l’archivio locale</h1>
          <p role="alert">{boot.error}</p>
          <p>
            Il browser potrebbe aver bloccato IndexedDB. Non cancellare i dati
            del sito se contengono progetti.
          </p>
          <button onClick={() => window.location.reload()}>Riprova</button>
        </main>
      </div>
    );
  }
  if (!boot.value) {
    return <p role="status">Apertura archivio locale…</p>;
  }
  return <LocalArchive data={boot.value} readError={boot.error} />;
}

function LocalArchive({
  data,
  readError,
}: {
  data: Awaited<ReturnType<typeof readArchive>>;
  readError: string | undefined;
}) {
  const session = data.session?.value as
    { projectId?: string; nodeId?: string } | undefined;
  // La selezione si inizializza una volta: le altre schede non possono navigare questa finestra.
  const [selection, setSelection] = useState<string | null>(
    () => session?.projectId ?? null,
  );
  const [sessionError, setSessionError] = useState('');
  const selected = data.projects.find((project) => project.id === selection);
  const error = readError || sessionError;
  if (!selected) {
    return (
      <>
        {error && <p role="alert">{error}</p>}
        <ProjectChooser
          projects={data.projects}
          theme={data.preferences.theme}
          onOpen={(id) => {
            setSelection(id);
            void db.preferences
              .put({ id: 'session', value: { projectId: id } })
              .catch((reason: unknown) =>
                setSessionError(
                  `Impossibile ricordare l’ultimo progetto: ${String(reason)}`,
                ),
              );
          }}
        />
      </>
    );
  }
  return (
    <ProjectLoader
      key={selected.id}
      projectId={selected.id}
      initialNodeId={
        session?.projectId === selected.id ? session.nodeId : undefined
      }
      preferences={data.preferences}
      onProjects={() => setSelection(null)}
      externalError={error || undefined}
    />
  );
}

function ProjectLoader({
  projectId,
  initialNodeId,
  preferences,
  onProjects,
  externalError,
}: {
  projectId: string;
  initialNodeId: string | undefined;
  preferences: Preferences;
  onProjects: () => void;
  externalError: string | undefined;
}) {
  const query = useLocalQuery(
    () =>
      db.transaction('r', db.projectTables, () => readProject(db, projectId)),
    [projectId],
  );
  if (query.error && !query.value) {
    return <p role="alert">Errore di lettura: {query.error}</p>;
  }
  if (!query.value) {
    return <p role="status">Apertura progetto…</p>;
  }
  return (
    <ProjectSession
      snapshot={query.value}
      initialNodeId={initialNodeId}
      preferences={preferences}
      onProjects={onProjects}
      readError={query.error || externalError}
    />
  );
}
