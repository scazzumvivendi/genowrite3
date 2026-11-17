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
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [trash, setTrash] = useState(false);
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
  async function restore(id: string) {
    try {
      await projectService.setProjectDeleted(id, false);
    } catch (reason) {
      setError(String(reason));
    }
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
      <main>
        <span className="brand-mark">{t('g_fc3a68')}</span>
        <p className="section-label">{t('genowrite_3_4ba304')}</p>
        <h1>{t('uno_spazio_per_le_tue_parole_105d8f')}</h1>
        <p>
          {t(
            'scrivi_e_organizza_i_tuoi_progetti_su_questo_dispositivo_nessun_a_eaff54',
          )}
        </p>
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
        {restoreDialog && (
          <RestoreDialog
            onClose={() => setRestoreDialog(false)}
            onRestored={onOpen}
          />
        )}
        {error && <p role="alert">{error}</p>}
        <div className="panel-heading">
          <h2>
            {trash ? t('cestino_progetti_8d4d8d') : t('i_tuoi_progetti_03664f')}
          </h2>
          <button onClick={() => setTrash(!trash)}>
            {trash ? t('mostra_progetti_f0dbe3') : t('cestino_progetti_8d4d8d')}
          </button>
        </div>
        <ul className="project-list">
          {projects
            .filter((project) => Boolean(project.deletedAt) === trash)
            .map((project) => (
              <li key={project.id}>
                <div>
                  <strong>{project.title}</strong>
                  <small>
                    {project.author || t('autore_non_indicato_4a032f')}
                  </small>
                </div>
                <button
                  className="tonal"
                  onClick={() =>
                    trash ? void restore(project.id) : onOpen(project.id)
                  }
                >
                  {trash ? t('ripristina_cf1718') : t('apri_12abcf')}
                  <span className="sr-only"> {project.title}</span>
                </button>
              </li>
            ))}
        </ul>
        {!projects.some((project) => Boolean(project.deletedAt) === trash) && (
          <p>{t('nessun_progetto_in_questa_raccolta_aa88cb')}</p>
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
