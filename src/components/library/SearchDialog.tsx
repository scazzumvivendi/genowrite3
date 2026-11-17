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
    <Modal title="Cerca nel progetto" onClose={onClose} protectContent={false}>
      <label>
        Cerca testo, titoli e riferimenti
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
      </label>
      <p>{results.length} risultati</p>
      <ul className="search-results">
        {results.slice(0, 100).map((result) => (
          <li key={result.id}>
            <button onClick={() => onSelect(result)}>
              <strong>{result.title}</strong>
              <small>
                {result.type === 'node'
                  ? 'Manoscritto'
                  : result.type === 'note'
                    ? 'Nota'
                    : 'Scheda'}
              </small>
              <span>{result.excerpt}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
