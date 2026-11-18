import { t } from '../../i18n';
import { Icon } from '../common/Icon';
import type { SaveState } from '../../modules/storage/draft-saver';

const saveLabels: Record<SaveState, string> = {
  saved: t('salvato_sul_dispositivo_2f68d3'),
  pending: t('modifiche_da_salvare_65ace4'),
  saving: t('salvataggio_c4f57f'),
  error: t('errore_di_salvataggio_a121d2'),
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
  onDropbox,
  dropboxActive,
  syncActive,
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
  onDropbox: () => void;
  dropboxActive: boolean;
  syncActive: boolean;
}) {
  return (
    <header className="top-bar product-top-bar">
      <div className="brand-context">
        <button
          className="brand-mark"
          aria-label={t('progetti_d7805e')}
          title={t('progetti_d7805e')}
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
            aria-label={t('proprieta_progetto_value0_d08d50', {
              value0: projectTitle,
            })}
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
        aria-label={t('strumenti_dello_spazio_di_scrittura_a9ee8d')}
      >
        <button
          id="navigation-toggle"
          className="icon-button"
          aria-label={t('navigazione_1e7ed2')}
          aria-expanded={navigation}
          disabled={zen}
          onClick={onNavigation}
        >
          <Icon name="menu" />
        </button>
        <button
          id="inspector-toggle"
          className="icon-button"
          aria-label={t('dettagli_documento_09b5b5')}
          aria-expanded={inspector}
          disabled={zen}
          onClick={onInspector}
        >
          <Icon name="inspector" />
        </button>
        <button
          className="icon-button"
          aria-label={t('modalita_zen_7ce6af')}
          aria-pressed={zen}
          onClick={onZen}
        >
          <Icon name="zen" />
        </button>
        <button
          className="icon-button"
          aria-label={t('preferenze_7a5377')}
          onClick={onPreferences}
        >
          <Icon name="settings" />
        </button>
        <button
          type="button"
          className="icon-button dropbox-button"
          data-active={dropboxActive || syncActive}
          onClick={onDropbox}
          aria-label={t('dropbox_4750d0')}
          title={
            syncActive
              ? t('sync.enabledHint')
              : dropboxActive
                ? t('backup_dropbox_automatico_attivo_2b04ad')
                : t('backup_dropbox_59f66f')
          }
        >
          <Icon name="dropbox" />
        </button>
        <button
          className="icon-button"
          onClick={onExport}
          aria-label={t('esporta_2c4c51')}
          title={t('esporta_e_crea_backup_287741')}
        >
          <Icon name="export" />
        </button>
      </div>
    </header>
  );
}
