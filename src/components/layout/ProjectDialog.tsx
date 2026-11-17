import { useState } from 'react';
import type { Project } from '../../modules/manuscript/model';
import { projectService } from '../../modules/storage/project-service';
import { Modal } from '../common/Modal';

export function ProjectDialog({
  project,
  onClose,
  onDeleted,
}: {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState('');
  async function update(form: HTMLFormElement) {
    const data = new FormData(form);
    try {
      await projectService.updateProject(project.id, {
        title: String(data.get('title')),
        author: String(data.get('author')),
        description: String(data.get('description')),
        genre: String(data.get('genre')),
      });
      onClose();
    } catch (reason) {
      setError(String(reason));
    }
  }
  return (
    <Modal title="Proprietà progetto" onClose={onClose}>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void update(event.currentTarget);
        }}
      >
        <label>
          Titolo
          <input
            name="title"
            defaultValue={project.title}
            required
            maxLength={500}
          />
        </label>
        <label>
          Autore
          <input name="author" defaultValue={project.author} />
        </label>
        <label>
          Genere
          <input name="genre" defaultValue={project.genre} />
        </label>
        <label>
          Descrizione
          <textarea
            name="description"
            defaultValue={project.description}
            rows={3}
          />
        </label>
        <button className="filled-button">Salva progetto</button>
      </form>
      <button
        onClick={() => {
          if (
            window.confirm(
              `Spostare il progetto “${project.title}” nel cestino? Potrai ripristinarlo dalla raccolta progetti.`,
            )
          ) {
            void projectService
              .setProjectDeleted(project.id, true)
              .then(onDeleted)
              .catch((reason: unknown) => setError(String(reason)));
          }
        }}
      >
        Sposta progetto nel cestino
      </button>
    </Modal>
  );
}
