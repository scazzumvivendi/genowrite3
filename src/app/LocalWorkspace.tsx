import { t } from '../i18n';
import { readSync } from '../modules/dropbox/sync';
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
          <h1>{t('impossibile_aprire_l_archivio_locale_611b91')}</h1>
          <p role="alert">{boot.error}</p>
          <p>
            {t(
              'il_browser_potrebbe_aver_bloccato_indexeddb_non_cancellare_i_dati_f3acfc',
            )}
          </p>
          <button onClick={() => window.location.reload()}>
            {t('riprova_20b5f4')}
          </button>
        </main>
      </div>
    );
  }
  if (!boot.value) {
    return <p role="status">{t('apertura_archivio_locale_d8693e')}</p>;
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
  const selected = data.projects.find(
    (project) => project.id === selection && !project.deletedAt,
  );
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
                  t('impossibile_ricordare_l_ultimo_progetto_value0_07c8a5', {
                    value0: String(reason),
                  }),
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
      onProjects={() => {
        setSelection(null);
        void db.preferences
          .put({ id: 'session', value: {} })
          .catch((reason: unknown) => setSessionError(String(reason)));
      }}
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
      db.transaction('r', [...db.projectTables, db.preferences], async () => ({
        snapshot: await readProject(db, projectId),
        generation: (await readSync(projectId)).generation ?? '',
      })),
    [projectId],
  );
  if (query.error && !query.value) {
    return (
      <p role="alert">{t('archive.readError', { reason: query.error })}</p>
    );
  }
  if (!query.value) {
    return <p role="status">{t('apertura_progetto_047506')}</p>;
  }
  return (
    <ProjectSession
      snapshot={query.value.snapshot}
      syncGeneration={query.value.generation}
      initialNodeId={initialNodeId}
      preferences={preferences}
      onProjects={onProjects}
      readError={query.error || externalError}
    />
  );
}
