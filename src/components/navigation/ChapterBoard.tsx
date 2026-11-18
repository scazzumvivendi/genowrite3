import { t } from '../../i18n';
import {
  childrenOf,
  liveNodes,
  type ProjectSnapshot,
} from '../../modules/manuscript/model';
import { Icon } from '../common/Icon';

export function ChapterBoard({
  snapshot,
  onClose,
  onSelect,
  onMove,
  onManage,
}: {
  snapshot: ProjectSnapshot;
  onClose: () => void;
  onSelect: (id: string) => void;
  onMove: (id: string, index: number) => void;
  onManage: (id: string) => void;
}) {
  const chapters = childrenOf(liveNodes(snapshot), null);
  return (
    <main className="chapter-board" id="writing-main" tabIndex={-1}>
      <header>
        <h1>{t('board.title')}</h1>
        <button onClick={onClose}>{t('board.back')}</button>
      </header>
      <ol className="chapter-cards">
        {chapters.map((chapter, index) => (
          <li
            key={chapter.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                'application/genowrite-chapter',
                chapter.id,
              );
              event.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(event) => {
              if (
                event.dataTransfer.types.includes(
                  'application/genowrite-chapter',
                )
              ) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData(
                'application/genowrite-chapter',
              );
              if (
                id !== chapter.id &&
                chapters.some((item) => item.id === id)
              ) {
                onMove(id, index);
              }
            }}
          >
            <span className="chapter-number">{index + 1}</span>
            <h2>{chapter.title}</h2>
            <p>{chapter.synopsis || t('nessuna_sinossi_98f326')}</p>
            <div className="card-actions">
              <button onClick={() => onSelect(chapter.id)}>
                {t('board.open')}
              </button>
              <button onClick={() => onManage(chapter.id)}>
                {t('modifica_dettagli_b36bce')}
              </button>
              <button
                className="icon-button"
                aria-label={t('board.before')}
                disabled={index === 0}
                onClick={() => onMove(chapter.id, index - 1)}
              >
                <Icon name="up" />
              </button>
              <button
                className="icon-button"
                aria-label={t('board.after')}
                disabled={index === chapters.length - 1}
                onClick={() => onMove(chapter.id, index + 1)}
              >
                <Icon name="down" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      {!chapters.length && (
        <p>{t('inizia_con_un_capitolo_il_resto_puo_aspettare_1ea596')}</p>
      )}
    </main>
  );
}
