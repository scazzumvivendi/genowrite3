import { t } from '../../i18n';
import { useState } from 'react';
import type { ProjectSnapshot } from '../../modules/manuscript/model';
import { searchProject, type SearchResult } from '../../modules/library/search';
import { Modal } from '../common/Modal';

export function SearchDialog({
  snapshot,
  onSelect,
  onClose,
}: {
  snapshot: ProjectSnapshot;
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const results = searchProject(snapshot, query);
  return (
    <Modal
      title={t('cerca_nel_progetto_33398f')}
      onClose={onClose}
      protectContent={false}
    >
      <label>
        {t('cerca_testo_titoli_e_riferimenti_7d7208')}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
      </label>
      <p>{t('search.results', { count: results.length })}</p>
      <ul className="search-results">
        {results.slice(0, 100).map((result) => (
          <li key={result.id}>
            <button onClick={() => onSelect(result)}>
              <strong>{result.title}</strong>
              <small>
                {result.type === 'node'
                  ? t('manoscritto_bc53cf')
                  : result.type === 'note'
                    ? t('nota_ecef8a')
                    : t('scheda_458ab1')}
              </small>
              <span>{result.excerpt}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
