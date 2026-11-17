import { useState } from 'react';
import { db } from '../../database/db';
import {
  parseBackup,
  restoreBackup,
  type ProjectBackup,
} from '../../modules/backup/backup';
import { Modal } from '../common/Modal';

export function RestoreDialog({
  onClose,
  onRestored,
}: {
  onClose: () => void;
  onRestored: (id: string) => void;
}) {
  const [backup, setBackup] = useState<ProjectBackup>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function read(file: File | undefined) {
    try {
      if (!file) {
        return;
      }
      if (file.size > 100_000_000) {
        throw new Error('Il backup supera 100 MB.');
      }
      setBackup(parseBackup(await file.text()));
      setError('');
    } catch (reason) {
      setBackup(undefined);
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  return (
    <Modal
      title="Ripristina backup JSON"
      onClose={onClose}
      protectContent={false}
    >
      <label>
        File di backup
        <input
          type="file"
          accept=".json,application/json"
          onChange={(event) => void read(event.target.files?.[0])}
        />
      </label>
      {backup && (
        <>
          <h3>{backup.snapshot.project.title}</h3>
          <p>
            {backup.snapshot.nodes.length} elementi,{' '}
            {backup.snapshot.documents.length} documenti,{' '}
            {backup.snapshot.references.length} schede,{' '}
            {backup.snapshot.notes.length} note.
          </p>
          <p>
            Verrà creato un nuovo progetto con identificatori indipendenti.
            Nessun progetto esistente sarà sovrascritto.
          </p>
          <button
            className="filled-button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void restoreBackup(db, backup)
                .then(onRestored)
                .catch((reason: unknown) => setError(String(reason)))
                .finally(() => setBusy(false));
            }}
          >
            Ripristina come nuovo progetto
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </Modal>
  );
}
