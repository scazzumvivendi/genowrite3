import { confirmDiscard, markFormSaved } from '../common/form-state';
import { useRef, useState } from 'react';
import type {
  ProjectSnapshot,
  ReferenceRecord,
  Note,
} from '../../modules/manuscript/model';
import { libraryService } from '../../modules/library/service';
import { Modal } from '../common/Modal';

export type LibraryKind = ReferenceRecord['kind'] | 'note';
const labels: Record<LibraryKind, string> = {
  character: 'Personaggi',
  location: 'Luoghi',
  object: 'Oggetti',
  note: 'Note e ricerca',
};

export function LibraryDialog({
  snapshot,
  kind,
  initialId,
  onClose,
}: {
  snapshot: ProjectSnapshot;
  kind: LibraryKind;
  initialId?: string;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  function changeSelection(id?: string) {
    if (confirmDiscard(formRef.current)) {
      setSelectedId(id);
    }
  }
  const [selectedId, setSelectedId] = useState(initialId);
  const [error, setError] = useState('');
  const [trash, setTrash] = useState(false);
  const items =
    kind === 'note'
      ? snapshot.notes
      : snapshot.references.filter((record) => record.kind === kind);
  const current = items.find((item) => item.id === selectedId);
  const reference = current && 'name' in current ? current : undefined;
  const note = current && 'body' in current ? current : undefined;
  const links =
    note?.linkedNodeIds ??
    snapshot.relations
      .filter(
        (relation) =>
          relation.sourceId === reference?.id &&
          relation.relationType === 'appears_in',
      )
      .map((relation) => relation.targetId);
  async function save(form: HTMLFormElement) {
    const data = new FormData(form);
    const nodeIds = data.getAll('nodes').map(String);
    try {
      const title = String(data.get('title'));
      if (kind === 'note') {
        const id = await libraryService.saveNote(
          snapshot.project.id,
          {
            title,
            body: String(data.get('body')),
            kind: String(data.get('kind')) as Note['kind'],
            linkedNodeIds: nodeIds,
            linkedReferenceIds: data.getAll('references').map(String),
          },
          note?.id,
        );
        markFormSaved(form);
        setSelectedId(id);
      } else {
        const id = await libraryService.saveReference(
          snapshot.project.id,
          {
            kind,
            name: title,
            description: String(data.get('description')),
            notes: String(data.get('body')),
            fields: {
              ...reference?.fields,
              details: String(data.get('details')),
            },
          },
          nodeIds,
          reference?.id,
        );
        markFormSaved(form);
        setSelectedId(id);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  async function deleted(id: string, value: boolean) {
    if (
      value &&
      !window.confirm(
        'Spostare la scheda nel cestino? I collegamenti verranno conservati.',
      )
    ) {
      return;
    }
    try {
      await libraryService.setDeleted(
        snapshot.project.id,
        kind === 'note' ? 'note' : 'reference',
        id,
        value,
      );
      setSelectedId(undefined);
    } catch (reason) {
      setError(String(reason));
    }
  }
  return (
    <Modal title={labels[kind]} onClose={onClose}>
      {error && <p role="alert">{error}</p>}
      <p className="muted">
        Materiale di riferimento: escluso da conteggi ed esportazione del
        manoscritto.
      </p>
      <div className="dialog-actions">
        <button
          onClick={() => {
            setTrash(false);
            changeSelection(undefined);
          }}
        >
          Nuova scheda
        </button>
        <button
          onClick={() => {
            if (confirmDiscard(formRef.current)) {
              setTrash(!trash);
            }
          }}
        >
          {trash ? 'Mostra schede' : 'Cestino schede'}
        </button>
      </div>
      <ul className="library-list">
        {items
          .filter((item) => Boolean(item.deletedAt) === trash)
          .map((item) => (
            <li key={item.id}>
              <button onClick={() => changeSelection(item.id)}>
                {'name' in item ? item.name : item.title}
              </button>
              {trash && (
                <button onClick={() => void deleted(item.id, false)}>
                  Ripristina
                </button>
              )}
            </li>
          ))}
      </ul>
      {!trash && (!selectedId || current) && (
        <form
          ref={formRef}
          key={selectedId ?? 'new'}
          onSubmit={(event) => {
            event.preventDefault();
            void save(event.currentTarget);
          }}
        >
          <label>
            Nome o titolo
            <input
              name="title"
              required
              maxLength={500}
              defaultValue={reference?.name ?? note?.title ?? ''}
            />
          </label>
          {kind === 'note' ? (
            <label>
              Tipo nota
              <select name="kind" defaultValue={note?.kind ?? 'project_note'}>
                <option value="project_note">Nota di progetto</option>
                <option value="research">Ricerca</option>
                <option value="synopsis">Sinossi di progetto</option>
              </select>
            </label>
          ) : (
            <>
              <label>
                Descrizione
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={reference?.description ?? ''}
                />
              </label>
              <label>
                Dettagli liberi (ruolo, alias, caratteristiche)
                <textarea
                  name="details"
                  rows={2}
                  defaultValue={reference?.fields.details ?? ''}
                />
              </label>
            </>
          )}
          <label>
            Testo e appunti
            <textarea
              name="body"
              rows={6}
              defaultValue={reference?.notes ?? note?.body ?? ''}
            />
          </label>
          <fieldset>
            <legend>Collegamenti a capitoli e scene</legend>
            {snapshot.nodes
              .filter(
                (node) =>
                  !node.deletedAt && ['chapter', 'scene'].includes(node.type),
              )
              .map((node) => (
                <label className="checkbox-label" key={node.id}>
                  <input
                    type="checkbox"
                    name="nodes"
                    value={node.id}
                    defaultChecked={links.includes(node.id)}
                  />
                  {node.title}
                </label>
              ))}
          </fieldset>
          {kind === 'note' && (
            <fieldset>
              <legend>Collegamenti alle schede</legend>
              {snapshot.references
                .filter((record) => !record.deletedAt)
                .map((record) => (
                  <label className="checkbox-label" key={record.id}>
                    <input
                      type="checkbox"
                      name="references"
                      value={record.id}
                      defaultChecked={
                        note?.linkedReferenceIds.includes(record.id) ?? false
                      }
                    />
                    {record.name}
                  </label>
                ))}
            </fieldset>
          )}
          <button className="filled-button">Salva scheda</button>
          {current && (
            <button
              type="button"
              onClick={() => void deleted(current.id, true)}
            >
              Sposta scheda nel cestino
            </button>
          )}
        </form>
      )}
    </Modal>
  );
}
