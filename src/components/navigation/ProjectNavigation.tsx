import { t } from '../../i18n';
import type { LibraryKind } from '../library/LibraryDialog';
import type {
  ManuscriptNode,
  ProjectSnapshot,
} from '../../modules/manuscript/model';
import { childrenOf, liveNodes } from '../../modules/manuscript/model';
import { Icon } from '../common/Icon';

export function ProjectNavigation({
  snapshot,
  activeId,
  onSelect,
  onClose,
  onCreate,
  onManage,
  onBoard,
  onContext,
  onLibrary,
  onSearch,
}: {
  snapshot: ProjectSnapshot;
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onClose: () => void;
  onCreate: () => void;
  onManage: () => void;
  onBoard: () => void;
  onContext: (id: string) => void;
  onLibrary: (kind: LibraryKind) => void;
  onSearch: () => void;
}) {
  const nodes = liveNodes(snapshot);
  function branch(parentId: string | null) {
    return (
      <ul>
        {childrenOf(nodes, parentId).map((node) => (
          <li key={node.id}>{row(node)}</li>
        ))}
      </ul>
    );
  }
  function row(node: ManuscriptNode) {
    const button = (
      <button
        className="document-link"
        onContextMenu={(event) => {
          event.preventDefault();
          onContext(node.id);
        }}
        aria-current={node.id === activeId ? 'page' : undefined}
        onClick={() => onSelect(node.id)}
      >
        <Icon name={node.type === 'scene' ? 'scene' : 'chapter'} />
        <span>{node.title}</span>
      </button>
    );
    if (node.mode === 'scenes') {
      return (
        <details open>
          <summary>{button}</summary>
          {branch(node.id)}
        </details>
      );
    }
    return button;
  }
  return (
    <aside
      className="navigation-panel side-panel"
      id="manuscript-navigation"
      aria-label={t('navigazione_progetto_1aa2a6')}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div className="panel-heading">
        <h2>{t('manoscritto_bc53cf')}</h2>
        <button
          className="icon-button"
          aria-label={t('chiudi_navigazione_94a1a4')}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="panel-scroll">
        <div className="project-card">
          <Icon name="book" />
          <strong>{snapshot.project.title}</strong>
        </div>
        <div className="navigation-actions">
          <button className="tonal" onClick={onCreate}>
            {t('nuovo_elemento_8c610b')}
          </button>
          <button onClick={onBoard}>{t('board.title')}</button>
          <button onClick={onManage}>{t('organizza_916b93')}</button>
          <button onClick={onSearch}>{t('cerca_nel_progetto_33398f')}</button>
        </div>
        <nav className="manuscript-list" aria-label={t('manoscritto_bc53cf')}>
          {branch(null)}
        </nav>
        <div className="library-preview">
          <p className="section-label">{t('biblioteca_43ea03')}</p>
          {(
            [
              ['character', t('personaggi_5ab105')],
              ['location', t('luoghi_04b8bf')],
              ['object', t('oggetti_1de452')],
              ['note', t('note_e_ricerca_81890c')],
            ] as const
          ).map(([kind, label]) => (
            <button key={kind} onClick={() => onLibrary(kind)}>
              <Icon
                name={
                  kind === 'character'
                    ? 'people'
                    : kind === 'location'
                      ? 'pin'
                      : kind === 'object'
                        ? 'object'
                        : 'note'
                }
              />
              {label}
            </button>
          ))}
        </div>
        {!nodes.length && (
          <p className="empty-hint">
            {t('inizia_con_un_capitolo_il_resto_puo_aspettare_1ea596')}
          </p>
        )}
      </div>
    </aside>
  );
}
