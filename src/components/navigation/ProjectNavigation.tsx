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
      aria-label="Navigazione progetto"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <div className="panel-heading">
        <h2>Manoscritto</h2>
        <button
          className="icon-button"
          aria-label="Chiudi navigazione"
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
            Nuovo elemento
          </button>
          <button onClick={onManage}>Organizza</button>
          <button onClick={onSearch}>Cerca nel progetto</button>
        </div>
        <nav className="manuscript-list" aria-label="Manoscritto">
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
          Trascina qui per spostare alla radice
        </div>
        <div className="library-preview">
          <p className="section-label">BIBLIOTECA</p>
          {(
            [
              ['character', 'Personaggi'],
              ['location', 'Luoghi'],
              ['object', 'Oggetti'],
              ['note', 'Note e ricerca'],
            ] as const
          ).map(([kind, label]) => (
            <button key={kind} onClick={() => onLibrary(kind)}>
              {label}
            </button>
          ))}
        </div>
        {!nodes.length && (
          <p className="empty-hint">
            Inizia creando un capitolo. Volumi, parti e scene sono facoltativi.
          </p>
        )}
      </div>
    </aside>
  );
}
