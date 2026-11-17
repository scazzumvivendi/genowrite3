import { t } from '../../i18n';
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
    <Modal title={t('proprieta_progetto_d54e34')} onClose={onClose}>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void update(event.currentTarget);
        }}
      >
        <label>
          {t('titolo_d8f4ee')}
          <input
            name="title"
            defaultValue={project.title}
            required
            maxLength={500}
          />
        </label>
        <label>
          {t('autore_80e378')}
          <input name="author" defaultValue={project.author} />
        </label>
        <label>
          {t('genere_103424')}
          <input name="genre" defaultValue={project.genre} />
        </label>
        <label>
          {t('descrizione_6fb818')}
          <textarea
            name="description"
            defaultValue={project.description}
            rows={3}
          />
        </label>
        <button className="filled-button">{t('salva_progetto_ff9aff')}</button>
      </form>
      <button
        onClick={() => {
          if (
            window.confirm(
              t(
                'spostare_il_progetto_value0_nel_cestino_potrai_ripristinarlo_dall_02f2f7',
                { value0: project.title },
              ),
            )
          ) {
            void projectService
              .setProjectDeleted(project.id, true)
              .then(onDeleted)
              .catch((reason: unknown) => setError(String(reason)));
          }
        }}
      >
        {t('sposta_progetto_nel_cestino_c7b1bf')}
      </button>
    </Modal>
  );
}
