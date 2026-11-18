import { ProjectDialog } from './ProjectDialog';
import { Icon } from '../common/Icon';
import { t } from '../../i18n';
import { useSystemTheme } from '../../hooks/useSystemTheme';
import type { Preferences } from '../../modules/settings/preferences';
import { RestoreDialog } from '../export/RestoreDialog';
import { useState } from 'react';
import type { Project } from '../../modules/manuscript/model';
import { projectService } from '../../modules/storage/project-service';

export function ProjectChooser({
  projects,
  onOpen,
  theme,
}: {
  projects: Project[];
  onOpen: (id: string) => void;
  theme: Preferences['theme'];
}) {
  const systemDark = useSystemTheme();
  const [trash, setTrash] = useState(false);
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState('recent');
  const [editing, setEditing] = useState<Project | null>(null);
  const collection = projects.filter(
    (project) => Boolean(project.deletedAt) === trash,
  );
  const visible = collection
    .filter((project) =>
      [project.title, project.author, project.genre].some((value) =>
        value
          ?.toLocaleLowerCase('it')
          .includes(search.trim().toLocaleLowerCase('it')),
      ),
    )
    .sort((a, b) =>
      order === 'title'
        ? a.title.localeCompare(b.title, 'it')
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  async function create(form: HTMLFormElement) {
    setBusy(true);
    try {
      const id = await projectService.createProject(
        String(new FormData(form).get('title')),
      );
      onOpen(id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  async function remove(project: Project) {
    if (
      !window.confirm(
        t(
          'spostare_il_progetto_value0_nel_cestino_potrai_ripristinarlo_dall_02f2f7',
          { value0: project.title },
        ),
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await projectService.setProjectDeleted(project.id, true);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  async function restore(id: string) {
    setBusy(true);
    try {
      await projectService.setProjectDeleted(id, false);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  if (restoreDialog) {
    return (
      <div
        className="theme"
        data-theme={
          theme === 'dark' || (theme === 'system' && systemDark)
            ? 'dark'
            : 'light'
        }
      >
        <RestoreDialog
          onClose={() => setRestoreDialog(false)}
          onRestored={onOpen}
        />
      </div>
    );
  }
  return (
    <div
      className="theme project-chooser"
      data-theme={
        theme === 'dark' || (theme === 'system' && systemDark)
          ? 'dark'
          : 'light'
      }
    >
      <main className="project-home product-dialog">
        <header className="project-home-header">
          <span className="brand-mark">
            <img
              src={`${import.meta.env.BASE_URL}icon.svg`}
              alt=""
              width="44"
              height="44"
            />
          </span>
          <div>
            <h1>{t('home.brand')}</h1>
            <p>{t('home.subtitle')}</p>
          </div>
        </header>
        <section className="project-create" aria-labelledby="create-heading">
          <div>
            <h2 id="create-heading">{t('home.new')}</h2>
            <p>{t('home.newHint')}</p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void create(event.currentTarget);
            }}
          >
            <label>
              {t('titolo_del_nuovo_progetto_e09a85')}
              <input
                name="title"
                required
                maxLength={500}
                placeholder={t('il_mio_romanzo_187307')}
                autoComplete="off"
              />
            </label>
            <button className="filled-button" disabled={busy}>
              {t('crea_progetto_c19c5c')}
            </button>
          </form>
          <button className="tonal" onClick={() => setRestoreDialog(true)}>
            {t('ripristina_backup_597c6e')}
          </button>
        </section>
        {editing && (
          <ProjectDialog
            project={editing}
            onClose={() => setEditing(null)}
            onDeleted={() => setEditing(null)}
          />
        )}
        {error && <p role="alert">{error}</p>}
        <div className="panel-heading">
          <h2>{trash ? t('cestino_progetti_8d4d8d') : t('progetti_d7805e')}</h2>
          <button onClick={() => setTrash(!trash)}>
            {trash ? t('mostra_progetti_f0dbe3') : t('cestino_progetti_8d4d8d')}
          </button>
        </div>
        <div className="project-filters">
          <label>
            {t('home.search')}
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            {t('home.sort')}
            <select
              value={order}
              onChange={(event) => setOrder(event.target.value)}
            >
              <option value="recent">{t('home.recent')}</option>
              <option value="title">{t('titolo_d8f4ee')}</option>
            </select>
          </label>
          <p role="status">
            {t('home.count', {
              count: visible.length,
              total: collection.length,
            })}
          </p>
        </div>
        <ul className="project-list project-cards">
          {visible.map((project) => (
            <li key={project.id}>
              <div className="project-card-heading">
                <Icon name="book" />
                <div>
                  <strong>{project.title}</strong>
                  <small>
                    {project.author || t('autore_non_indicato_4a032f')}
                  </small>
                </div>
              </div>
              {project.description && (
                <p className="project-description">{project.description}</p>
              )}
              <div className="project-metadata">
                {project.genre && <span>{project.genre}</span>}
                <span>
                  {t('home.updated')}{' '}
                  <time dateTime={project.updatedAt}>
                    {new Date(project.updatedAt).toLocaleDateString('it-IT')}
                  </time>
                </span>
              </div>
              <div className="dialog-actions">
                <button
                  disabled={busy}
                  className="tonal"
                  onClick={() =>
                    trash ? void restore(project.id) : onOpen(project.id)
                  }
                >
                  {trash ? t('ripristina_cf1718') : t('apri_12abcf')}
                  <span className="sr-only"> {project.title}</span>
                </button>
                {!trash && (
                  <button disabled={busy} onClick={() => setEditing(project)}>
                    {t('proprieta_progetto_d54e34')}
                    <span className="sr-only"> {project.title}</span>
                  </button>
                )}
                {!trash && (
                  <button disabled={busy} onClick={() => void remove(project)}>
                    {t('sposta_nel_cestino_dd41b3')}
                    <span className="sr-only"> {project.title}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {visible.length === 0 && (
          <div className="project-empty">
            <Icon name="book" />
            <h3>
              {search
                ? t('home.noResults')
                : trash
                  ? t('home.emptyTrash')
                  : t('home.empty')}
            </h3>
            <p>
              {search
                ? t('home.searchHint')
                : trash
                  ? t('home.trashHint')
                  : t('home.emptyHint')}
            </p>
          </div>
        )}
        <p className="local-storage-note">
          {t(
            'i_dati_sono_conservati_nel_browser_crea_regolarmente_backup_json__d60c8b',
          )}
        </p>
      </main>
    </div>
  );
}
