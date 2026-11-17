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
  onMove,
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
  onMove: (id: string, parentId: string | null, index: number) => void;
  onContext: (id: string) => void;
  onLibrary: (kind: LibraryKind) => void;
  onSearch: () => void;
}) {
  const nodes = liveNodes(snapshot);
  function branch(parentId: string | null) {
    return (
      <ul>
        {childrenOf(nodes, parentId).map((node) => (
          <li key={node.id}>
            <div
              className="drop-before"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const movingId = event.dataTransfer.getData(
                  'application/genowrite-node',
                );
                const siblings = childrenOf(nodes, node.parentId).filter(
                  (item) => item.id !== movingId,
                );
                onMove(
                  movingId,
                  node.parentId,
                  siblings.findIndex((item) => item.id === node.id),
                );
              }}
              aria-hidden="true"
            />
            {row(node)}
          </li>
        ))}
      </ul>
    );
  }
  function row(node: ManuscriptNode) {
    const button = (
      <button
        className="document-link"
        draggable
        onDragStart={(event) =>
          event.dataTransfer.setData('application/genowrite-node', node.id)
        }
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onMove(
            event.dataTransfer.getData('application/genowrite-node'),
            node.id,
            childrenOf(nodes, node.id).length,
          );
        }}
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
    if (
      ['volume', 'part', 'folder'].includes(node.type) ||
      node.mode === 'scenes'
    ) {
      return (
        <details open>
          <summary>{node.title}</summary>
          {button}
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
          <button onClick={onManage}>{t('organizza_916b93')}</button>
          <button onClick={onSearch}>{t('cerca_nel_progetto_33398f')}</button>
        </div>
        <nav className="manuscript-list" aria-label={t('manoscritto_bc53cf')}>
          {branch(null)}
        </nav>
        <div
          className="root-drop"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onMove(
              event.dataTransfer.getData('application/genowrite-node'),
              null,
              childrenOf(nodes, null).length,
            );
          }}
        >
          {t('trascina_qui_per_spostare_alla_radice_77519f')}
        </div>
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
              {label}
            </button>
          ))}
        </div>
        {!nodes.length && (
          <p className="empty-hint">
            {t(
              'inizia_creando_un_capitolo_volumi_parti_e_scene_sono_facoltativi_2fbb6c',
            )}
          </p>
        )}
      </div>
    </aside>
  );
}
