import { Icon } from '../common/Icon';
import type { SaveState } from '../../modules/storage/draft-saver';

const saveLabels: Record<SaveState, string> = {
  saved: 'Salvato sul dispositivo',
  pending: 'Modifiche da salvare…',
  saving: 'Salvataggio…',
  error: 'Errore di salvataggio',
};
export function LocalTopBar({
  projectTitle,
  title,
  state,
  navigation,
  inspector,
  zen,
  onNavigation,
  onInspector,
  onZen,
  onProjects,
  onProperties,
  onPreferences,
  onExport,
}: {
  projectTitle: string;
  title: string;
  state: SaveState;
  navigation: boolean;
  inspector: boolean;
  zen: boolean;
  onNavigation: () => void;
  onInspector: () => void;
  onZen: () => void;
  onProjects: () => void;
  onProperties: () => void;
  onPreferences: () => void;
  onExport: () => void;
}) {
  return (
    <header className="top-bar product-top-bar">
      <div className="brand-context">
        <button
          className="brand-mark"
          aria-label="Progetti"
          title="Progetti"
          onClick={onProjects}
        >
          <img
            src={`${import.meta.env.BASE_URL}icon.svg`}
            alt=""
            width="44"
            height="44"
          />
        </button>
        <div className="project-context">
          <button
            className="project-title-button"
            onClick={onProperties}
            aria-label={`Proprietà progetto · ${projectTitle}`}
          >
            {projectTitle}
          </button>
          <span className="current-context">
            <span className="current-document-title">{title}</span>
            <span aria-hidden="true">/</span>
            <span role="status">{saveLabels[state]}</span>
          </span>
        </div>
      </div>
      <div
        className="workspace-actions"
        role="group"
        aria-label="Strumenti dello spazio di scrittura"
      >
        <button
          id="navigation-toggle"
          className="icon-button"
          aria-label="Navigazione"
          aria-expanded={navigation}
          disabled={zen}
          onClick={onNavigation}
        >
          <Icon name="menu" />
        </button>
        <button
          id="inspector-toggle"
          className="icon-button"
          aria-label="Dettagli documento"
          aria-expanded={inspector}
          disabled={zen}
          onClick={onInspector}
        >
          <Icon name="inspector" />
        </button>
        <button
          className="icon-button"
          aria-label="Modalità Zen"
          aria-pressed={zen}
          onClick={onZen}
        >
          <Icon name="zen" />
        </button>
        <button
          className="icon-button"
          aria-label="Preferenze"
          onClick={onPreferences}
        >
          <Icon name="settings" />
        </button>
        <button
          className="export-button"
          onClick={onExport}
          aria-label="Esporta"
          title="Esporta e crea backup"
        >
          <Icon name="export" />
          <span>Esporta</span>
        </button>
      </div>
    </header>
  );
}
