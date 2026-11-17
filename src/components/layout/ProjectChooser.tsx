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
        <span className="brand-mark">g.</span>
        <p className="section-label">GENOWRITE 3</p>
        <h1>Uno spazio per le tue parole.</h1>
        <p>
          Scrivi e organizza i tuoi progetti su questo dispositivo. Nessun
          account.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void create(event.currentTarget);
          }}
        >
          <label>
            Titolo del nuovo progetto
            <input
              name="title"
              required
              maxLength={500}
              placeholder="Il mio romanzo"
              autoComplete="off"
            />
          </label>
          <button className="filled-button" disabled={busy}>
            Crea progetto
          </button>
        </form>
        <button className="tonal" onClick={() => setRestoreDialog(true)}>
          Ripristina backup
        </button>
        {restoreDialog && (
          <RestoreDialog
            onClose={() => setRestoreDialog(false)}
            onRestored={onOpen}
          />
        )}
        {error && <p role="alert">{error}</p>}
        <div className="panel-heading">
          <h2>{trash ? 'Cestino progetti' : 'I tuoi progetti'}</h2>
          <button onClick={() => setTrash(!trash)}>
            {trash ? 'Mostra progetti' : 'Cestino progetti'}
          </button>
        </div>
        <ul className="project-list">
          {projects
            .filter((project) => Boolean(project.deletedAt) === trash)
            .map((project) => (
              <li key={project.id}>
                <div>
                  <strong>{project.title}</strong>
                  <small>{project.author || 'Autore non indicato'}</small>
                </div>
                <button
                  className="tonal"
                  onClick={() =>
                    trash ? void restore(project.id) : onOpen(project.id)
                  }
                >
                  {trash ? 'Ripristina' : 'Apri'}
                  <span className="sr-only"> {project.title}</span>
                </button>
              </li>
            ))}
        </ul>
        {!projects.some((project) => Boolean(project.deletedAt) === trash) && (
          <p>Nessun progetto in questa raccolta.</p>
        )}
        <p className="local-storage-note">
          I dati sono conservati nel browser: crea regolarmente backup JSON. La
          cancellazione dei dati del sito li rimuove. Usa sempre lo stesso
          indirizzo e profilo del browser.
        </p>
      </main>
    </div>
  );
}
