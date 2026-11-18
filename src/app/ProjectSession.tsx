import { t } from '../i18n';
import { useDropboxSync } from '../hooks/useDropboxSync';
import { ChapterBoard } from '../components/navigation/ChapterBoard';
import { DropboxDialog } from '../components/dropbox/DropboxDialog';
import { useDropboxAutomatic } from '../hooks/useDropboxAutomatic';
import { useSystemTheme } from '../hooks/useSystemTheme';
import { download } from '../modules/export/download';
import { safeFilename } from '../modules/export/manuscript';
import { registerActiveFlush } from './pwa/flush-active';
import { ExportDialog } from '../components/export/ExportDialog';
import {
  LibraryDialog,
  type LibraryKind,
} from '../components/library/LibraryDialog';
import { SearchDialog } from '../components/library/SearchDialog';
import { rebuildStatistics } from '../modules/statistics/cache';
import { WritingStatistics } from '../components/statistics/WritingStatistics';
import { lazy, Suspense, useEffect, useState } from 'react';
import { db } from '../database/db';
import { useCompactLayout } from '../hooks/useCompactLayout';
import { projectService } from '../modules/storage/project-service';
import { DraftSaver, type SaveState } from '../modules/storage/draft-saver';
import type { Preferences } from '../modules/settings/preferences';
import { type ProjectSnapshot } from '../modules/manuscript/model';
import { LocalTopBar } from '../components/layout/LocalTopBar';
import { LocalPreferences } from '../components/layout/LocalPreferences';
import { ProjectDialog } from '../components/layout/ProjectDialog';
import { NodeDialog } from '../components/layout/NodeDialog';
import { ProjectNavigation } from '../components/navigation/ProjectNavigation';
import './workspace.css';
import './styles/product.css';

const LocalDocument = lazy(() =>
  import('../components/layout/LocalDocument').then((module) => ({
    default: module.LocalDocument,
  })),
);

export function ProjectSession({
  snapshot,
  initialNodeId,
  preferences,
  onProjects,
  readError,
  syncGeneration,
}: {
  snapshot: ProjectSnapshot;
  initialNodeId: string | undefined;
  preferences: Preferences;
  onProjects: () => void;
  readError: string | undefined;
  syncGeneration: string;
}) {
  const compact = useCompactLayout();
  const systemDark = useSystemTheme();
  const [activeId, setActiveId] = useState(initialNodeId);
  const [navigation, setNavigation] = useState(!compact);
  const [inspector, setInspector] = useState(false);
  const [zen, setZen] = useState(false);
  const [board, setBoard] = useState(false);
  const [dialog, setDialog] = useState<
    | 'create'
    | 'manage'
    | 'preferences'
    | 'project'
    | 'library'
    | 'search'
    | 'export'
    | 'dropbox'
  >();
  const [save, setSave] = useState<SaveState>('saved');
  const [error, setError] = useState('');
  const [libraryKind, setLibraryKind] = useState<LibraryKind>('character');
  const [libraryId, setLibraryId] = useState<string>();
  const [saver] = useState(
    () =>
      new DraftSaver(
        projectService,
        (state, message) => {
          setSave(state);
          if (message) {
            setError(message);
          }
        },
        preferences.autosaveDelay,
      ),
  );
  const [editorGeneration, setEditorGeneration] = useState({
    observed: syncGeneration,
    applied: syncGeneration,
  });
  if (editorGeneration.observed !== syncGeneration) {
    setEditorGeneration({
      observed: syncGeneration,
      applied: saver.dirty ? editorGeneration.applied : syncGeneration,
    });
  }
  const sync = useDropboxSync(
    snapshot.project.id,
    saver,
    Boolean(dialog) || board,
  );
  const automatic = useDropboxAutomatic(snapshot.project.id, saver);
  // Un cestinamento concorrente non deve smontare l’editor con una bozza aperta.
  const node = snapshot.nodes.find((item) => item.id === activeId);
  const removedNode = snapshot.nodes.find(
    (item) => item.id === activeId && item.deletedAt,
  );
  const warning =
    error ||
    sync.value?.error ||
    sync.error ||
    automatic.error ||
    (automatic.value?.error
      ? t('backup_dropbox_in_pausa_value0_1edbfd', {
          value0: automatic.value.error,
        })
      : '') ||
    readError ||
    (snapshot.project.deletedAt
      ? t(
          'questo_progetto_e_stato_spostato_nel_cestino_il_testo_rimane_cons_ab0746',
        )
      : removedNode
        ? t(
            'l_elemento_aperto_e_stato_spostato_nel_cestino_il_testo_e_conserv_a07304',
          )
        : '');
  const document = snapshot.documents.find(
    (item) => item.id === node?.documentId,
  );
  const navigationOpen = navigation && !zen && !(compact && inspector);
  const inspectorOpen = inspector && !zen;
  const dark =
    preferences.theme === 'dark' ||
    (preferences.theme === 'system' && systemDark);

  useEffect(
    () => saver.setDelay(preferences.autosaveDelay),
    [saver, preferences.autosaveDelay],
  );
  useEffect(() => registerActiveFlush(() => saver.flush()), [saver]);
  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (saver.dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    }
    function visibility() {
      if (window.document.visibilityState === 'hidden') {
        void saver.flush().catch(() => undefined);
      }
    }
    window.addEventListener('beforeunload', beforeUnload);
    window.document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.document.removeEventListener('visibilitychange', visibility);
      saver.stopTimer();
    };
  }, [saver]);

  async function run(action: () => void | Promise<void>) {
    try {
      await saver.flush();
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  function closePanel(panel: 'navigation' | 'inspector') {
    if (panel === 'navigation') {
      setNavigation(false);
    } else {
      setInspector(false);
    }
    window.document.getElementById(`${panel}-toggle`)?.focus();
  }
  function select(id?: string) {
    void run(async () => {
      setActiveId(id);
      await db.preferences.put({
        id: 'session',
        value: { projectId: snapshot.project.id, nodeId: id },
      });
      if (compact) {
        setNavigation(false);
      }
      requestAnimationFrame(() =>
        window.document.getElementById('writing-main')?.focus(),
      );
    });
  }
  if (dialog === 'dropbox') {
    return (
      <div className="theme" data-theme={dark ? 'dark' : 'light'}>
        <DropboxDialog
          projectId={snapshot.project.id}
          flush={() => saver.flush()}
          onClose={() => setDialog(undefined)}
          onRestored={() => onProjects()}
        />
      </div>
    );
  }
  return (
    <div
      className={`theme writing-shell${zen ? ' is-zen' : ''}`}
      data-theme={dark ? 'dark' : 'light'}
    >
      <a className="skip-link" href="#writing-main">
        {t('vai_alla_scrittura_73a43b')}
      </a>
      <LocalTopBar
        projectTitle={snapshot.project.title}
        title={node?.title ?? t('manoscritto_bc53cf')}
        state={save}
        navigation={navigationOpen}
        inspector={inspectorOpen}
        zen={zen}
        onNavigation={() => {
          setNavigation(!navigationOpen);
          if (compact) {
            setInspector(false);
          }
        }}
        onInspector={() => {
          setInspector(!inspectorOpen);
          if (compact) {
            setNavigation(false);
          }
        }}
        onZen={() => setZen(!zen)}
        onProjects={() => void run(onProjects)}
        onProperties={() => void run(() => setDialog('project'))}
        onPreferences={() => setDialog('preferences')}
        onExport={() => setDialog('export')}
        onDropbox={() => void run(() => setDialog('dropbox'))}
        dropboxActive={automatic.value?.enabled ?? false}
        syncActive={sync.value?.enabled ?? false}
      />
      <div
        className="workspace-grid"
        data-navigation={navigationOpen}
        data-inspector={inspectorOpen}
      >
        {navigationOpen && (
          <ProjectNavigation
            snapshot={snapshot}
            activeId={activeId}
            onSelect={select}
            onClose={() => closePanel('navigation')}
            onCreate={() => setDialog('create')}
            onManage={() => setDialog('manage')}
            onBoard={() => void run(() => setBoard(true))}
            onContext={(id) =>
              void run(() => {
                setActiveId(id);
                setDialog('manage');
              })
            }
            onLibrary={(kind) => {
              setLibraryKind(kind);
              setLibraryId(undefined);
              setDialog('library');
            }}
            onSearch={() => void run(() => setDialog('search'))}
          />
        )}
        {board ? (
          <ChapterBoard
            snapshot={snapshot}
            onClose={() => setBoard(false)}
            onSelect={(id) => {
              setBoard(false);
              select(id);
            }}
            onMove={(id, index) =>
              void run(() =>
                projectService.moveNode(snapshot.project.id, id, null, index),
              )
            }
            onManage={(id) => {
              setActiveId(id);
              setDialog('manage');
            }}
          />
        ) : document && node ? (
          <Suspense
            fallback={
              <main className="writing-main" role="status">
                {t('apertura_documento_b4826c')}
              </main>
            }
          >
            <LocalDocument
              key={`${document.id}:${editorGeneration.applied}`}
              node={node}
              document={document}
              saver={saver}
              preferences={preferences}
            />
          </Suspense>
        ) : (
          <main
            className="writing-main empty-workspace"
            id="writing-main"
            tabIndex={-1}
          >
            <div>
              <p className="document-breadcrumb">{snapshot.project.title}</p>
              <h1>{node?.title ?? t('la_tua_prossima_storia_ab0357')}</h1>
              <p>
                {node
                  ? t(
                      'questo_elemento_organizza_il_manoscritto_seleziona_un_capitolo_o__0db0a6',
                    )
                  : t('inizia_con_un_capitolo_il_resto_puo_aspettare_1ea596')}
              </p>
              <button
                className="filled-button"
                onClick={() => setDialog('create')}
              >
                {t('nuovo_elemento_8c610b')}
              </button>
              <button onClick={() => setDialog('manage')}>
                {t('organizza_916b93')}
              </button>
            </div>
          </main>
        )}
        {inspectorOpen && (
          <aside
            className="inspector-panel side-panel"
            aria-label={t('dettagli_documento_09b5b5')}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                closePanel('inspector');
              }
            }}
          >
            <div className="panel-heading">
              <h2>{t('dettagli_1a45b0')}</h2>
              <button onClick={() => closePanel('inspector')}>
                {t('chiudi_32d407')}
              </button>
            </div>
            <div className="panel-scroll">
              <h3>{node?.title ?? snapshot.project.title}</h3>
              <p>{node?.synopsis || t('nessuna_sinossi_98f326')}</p>
              <h3>{t('riferimenti_collegati_32d5ee')}</h3>
              {snapshot.references
                .filter(
                  (record) =>
                    !record.deletedAt &&
                    snapshot.relations.some(
                      (relation) =>
                        relation.sourceId === record.id &&
                        relation.targetId === node?.id &&
                        relation.targetType === 'node',
                    ),
                )
                .map((record) => (
                  <button
                    key={record.id}
                    onClick={() => {
                      setLibraryKind(record.kind);
                      setLibraryId(record.id);
                      setDialog('library');
                    }}
                  >
                    {record.name}
                  </button>
                ))}
              <h3>{t('note_collegate_59690d')}</h3>
              {snapshot.notes
                .filter(
                  (note) =>
                    !note.deletedAt &&
                    note.linkedNodeIds.includes(node?.id ?? ''),
                )
                .map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      setLibraryKind('note');
                      setLibraryId(note.id);
                      setDialog('library');
                    }}
                  >
                    {note.title}
                  </button>
                ))}

              <button
                onClick={() =>
                  void run(() => rebuildStatistics(snapshot.project.id))
                }
              >
                {t('ricalcola_conteggi_491540')}
              </button>
              <button onClick={() => setDialog(node ? 'manage' : 'project')}>
                {t('modifica_dettagli_b36bce')}
              </button>
            </div>
          </aside>
        )}
      </div>
      <WritingStatistics snapshot={snapshot} node={node} />
      {warning && (
        <div className="error-banner" role="alert">
          <p>{warning}</p>
          {snapshot.project.deletedAt && (
            <button
              onClick={() =>
                void run(() =>
                  projectService.setProjectDeleted(snapshot.project.id, false),
                )
              }
            >
              {t('ripristina_progetto_a781ac')}
            </button>
          )}
          {removedNode && (
            <button onClick={() => setDialog('manage')}>
              {t('apri_cestino_elementi_6c1a11')}
            </button>
          )}
          <button onClick={() => void run(() => setError(''))}>
            {t('riprova_salvataggio_d8ba9d')}
          </button>
          <button
            onClick={() => {
              const copy = structuredClone(snapshot);
              const pending = saver.pendingContent();
              for (const document of copy.documents) {
                document.content = pending.get(document.id) ?? document.content;
              }
              download(
                new Blob(
                  [
                    JSON.stringify({
                      format: 'genowrite3',
                      version: 2,
                      exportedAt: new Date().toISOString(),
                      snapshot: copy,
                    }),
                  ],
                  { type: 'application/json' },
                ),
                `${safeFilename(copy.project.title)}-emergenza.genowrite3.json`,
              );
            }}
          >
            {t('scarica_copia_di_emergenza_ce5617')}
          </button>
          <button onClick={() => setError('')}>
            {t('chiudi_avviso_892129')}
          </button>
        </div>
      )}
      {(dialog === 'create' || dialog === 'manage') && (
        <NodeDialog
          snapshot={snapshot}
          node={node}
          mode={dialog}
          flush={() => saver.flush()}
          onClose={() => setDialog(undefined)}
          onDone={(id) => {
            setDialog(undefined);
            select(id);
          }}
        />
      )}
      {dialog === 'project' && (
        <ProjectDialog
          project={snapshot.project}
          onClose={() => setDialog(undefined)}
          onDeleted={onProjects}
        />
      )}
      {dialog === 'export' && (
        <ExportDialog
          onDropbox={() => void run(() => setDialog('dropbox'))}
          snapshot={snapshot}
          defaultProfile={preferences.defaultExportProfile}
          flush={() => saver.flush()}
          onClose={() => setDialog(undefined)}
        />
      )}
      {dialog === 'library' && (
        <LibraryDialog
          snapshot={snapshot}
          kind={libraryKind}
          {...(libraryId ? { initialId: libraryId } : {})}
          onClose={() => setDialog(undefined)}
        />
      )}
      {dialog === 'search' && (
        <SearchDialog
          snapshot={snapshot}
          onClose={() => setDialog(undefined)}
          onSelect={(result) => {
            if (result.type === 'node') {
              setDialog(undefined);
              select(result.id);
            } else {
              setLibraryKind(
                result.type === 'note'
                  ? 'note'
                  : snapshot.references.find(
                      (record) => record.id === result.id,
                    )!.kind,
              );
              setLibraryId(result.id);
              setDialog('library');
            }
          }}
        />
      )}
      {dialog === 'preferences' && (
        <LocalPreferences
          preferences={preferences}
          onClose={() => setDialog(undefined)}
        />
      )}
    </div>
  );
}
