import { t, locale } from '../../i18n';
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
          <strong>{value.words.toLocaleString(locale)}</strong>
          {t('parole_a57e3b')} <span className="stat-divider">·</span>{' '}
          <strong>{value.characters.toLocaleString(locale)}</strong>
          {t('caratteri_016b5f')} <span className="stat-divider">·</span>{' '}
          <strong>{readingMinutes(value.words, readingSpeed)}</strong>
          {t('min_2e7573')}
        </p>
      </section>
    );
  }
  return (
    <footer
      className="writing-statistics"
      aria-label={t('statistiche_di_scrittura_723eaf')}
    >
      <div className="statistics-heading">
        {t('statistics.readingSpeed', { speed: readingSpeed })}
        {query.error && (
          <span role="alert">
            {t('cache_non_disponibile_conteggi_ricostruiti_dal_testo_eb2028')}
          </span>
        )}
      </div>
      <div className="statistics-groups">
        {group(
          t('statistiche_documento_corrente_3db4a0'),
          current,
          node?.mode === 'scenes'
            ? t('capitolo_scene_940182')
            : t('documento_cf4279'),
        )}
        {group(
          t('statistiche_intero_progetto_8a2641'),
          total,
          t('intero_progetto_226f8d'),
        )}
      </div>
    </footer>
  );
}
