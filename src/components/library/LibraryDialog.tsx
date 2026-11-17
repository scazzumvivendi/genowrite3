import { t } from '../../i18n';
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
  character: t('personaggi_5ab105'),
  location: t('luoghi_04b8bf'),
  object: t('oggetti_1de452'),
  note: t('note_e_ricerca_81890c'),
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
        t(
          'spostare_la_scheda_nel_cestino_i_collegamenti_verranno_conservati_95ed9e',
        ),
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
        {t(
          'materiale_di_riferimento_escluso_da_conteggi_ed_esportazione_del__f3a909',
        )}
      </p>
      <div className="dialog-actions">
        <button
          onClick={() => {
            setTrash(false);
            changeSelection(undefined);
          }}
        >
          {t('nuova_scheda_3305fe')}
        </button>
        <button
          onClick={() => {
            if (confirmDiscard(formRef.current)) {
              setTrash(!trash);
            }
          }}
        >
          {trash ? t('mostra_schede_ae13cb') : t('cestino_schede_728d74')}
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
                  {t('ripristina_cf1718')}
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
            {t('nome_o_titolo_4631dd')}
            <input
              name="title"
              required
              maxLength={500}
              defaultValue={reference?.name ?? note?.title ?? ''}
            />
          </label>
          {kind === 'note' ? (
            <label>
              {t('tipo_nota_643021')}
              <select name="kind" defaultValue={note?.kind ?? 'project_note'}>
                <option value="project_note">
                  {t('nota_di_progetto_dac4a9')}
                </option>
                <option value="research">{t('ricerca_152c39')}</option>
                <option value="synopsis">
                  {t('sinossi_di_progetto_ff39b7')}
                </option>
              </select>
            </label>
          ) : (
            <>
              <label>
                {t('descrizione_6fb818')}
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={reference?.description ?? ''}
                />
              </label>
              <label>
                {t('dettagli_liberi_ruolo_alias_caratteristiche_ad8739')}
                <textarea
                  name="details"
                  rows={2}
                  defaultValue={reference?.fields.details ?? ''}
                />
              </label>
            </>
          )}
          <label>
            {t('testo_e_appunti_13bb9e')}
            <textarea
              name="body"
              rows={6}
              defaultValue={reference?.notes ?? note?.body ?? ''}
            />
          </label>
          <fieldset>
            <legend>{t('collegamenti_a_capitoli_e_scene_d21b99')}</legend>
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
              <legend>{t('collegamenti_alle_schede_b607ff')}</legend>
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
          <button className="filled-button">{t('salva_scheda_436758')}</button>
          {current && (
            <button
              type="button"
              onClick={() => void deleted(current.id, true)}
            >
              {t('sposta_scheda_nel_cestino_98d438')}
            </button>
          )}
        </form>
      )}
    </Modal>
  );
}
