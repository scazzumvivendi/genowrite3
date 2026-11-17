import { useSyncExternalStore } from 'react';
import { db } from '../../database/db';
import { useLocalQuery } from '../../hooks/useLocalQuery';
import type {
  ManuscriptNode,
  ProjectSnapshot,
} from '../../modules/manuscript/model';
import {
  addCounts,
  countContent,
  projectCounts,
  readingMinutes,
  zeroCounts,
  type Counts,
} from '../../modules/statistics/counts';
import {
  getLiveCounts,
  subscribeCounts,
} from '../../modules/statistics/live-counts';

export function WritingStatistics({
  snapshot,
  node,
  readingSpeed,
}: {
  snapshot: ProjectSnapshot;
  node: ManuscriptNode | undefined;
  readingSpeed: number;
}) {
  const query = useLocalQuery(
    () =>
      db.statistics.where('projectId').equals(snapshot.project.id).toArray(),
    [snapshot.project.id],
  );
  const transient = useSyncExternalStore(subscribeCounts, getLiveCounts);
  const { perDocument, total } = projectCounts(
    snapshot,
    query.value ?? [],
    transient,
  );
  const current = node?.documentId
    ? (perDocument.get(node.documentId) ??
      transient.get(node.documentId) ??
      countContent(
        snapshot.documents.find((document) => document.id === node.documentId)!
          .content,
      ))
    : node?.mode === 'scenes'
      ? addCounts(
          snapshot.nodes
            .filter((child) => child.parentId === node.id && !child.deletedAt)
            .map(
              (child) =>
                perDocument.get(child.documentId ?? '') ?? zeroCounts(),
            ),
        )
      : zeroCounts();
  function group(label: string, value: Counts, title: string) {
    return (
      <section className="statistic-group" aria-label={label}>
        <h2>{title}</h2>
        <p>
          <strong>{value.words.toLocaleString('it')}</strong> parole{' '}
          <span className="stat-divider">·</span>{' '}
          <strong>{value.characters.toLocaleString('it')}</strong> caratteri{' '}
          <span className="stat-divider">·</span>{' '}
          <strong>{readingMinutes(value.words, readingSpeed)}</strong> min
        </p>
      </section>
    );
  }
  return (
    <footer
      className="writing-statistics"
      aria-label="Statistiche di scrittura"
    >
      <div className="statistics-heading">
        Statistiche di scrittura · lettura {readingSpeed} parole/min
        {query.error && (
          <span role="alert">
            Cache non disponibile: conteggi ricostruiti dal testo.
          </span>
        )}
      </div>
      <div className="statistics-groups">
        {group(
          'Statistiche documento corrente',
          current,
          node?.mode === 'scenes' ? 'Capitolo · scene' : 'Documento',
        )}
        {group('Statistiche intero progetto', total, 'Intero progetto')}
      </div>
    </footer>
  );
}
