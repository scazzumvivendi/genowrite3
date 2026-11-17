import { writingStatusLabels } from '../../modules/manuscript/status';
import type { WritingStatus } from '../../modules/manuscript/model';
import { duplicateNode } from '../../modules/manuscript/duplicate';
import { useState } from 'react';
import type {
  ManuscriptNode,
  NodeType,
  ProjectSnapshot,
} from '../../modules/manuscript/model';
import { parentChildMatrix } from '../../modules/manuscript/validation';
import { projectService } from '../../modules/storage/project-service';
import { Modal } from '../common/Modal';

export function NodeDialog({
  snapshot,
  node,
  mode,
  onClose,
  onDone,
  flush,
}: {
  snapshot: ProjectSnapshot;
  node: ManuscriptNode | undefined;
  mode: 'create' | 'manage';
  onClose: () => void;
  onDone: (id?: string) => void;
  flush: () => Promise<void>;
}) {
  const [type, setType] = useState<NodeType>(
    node?.mode === 'scenes' ? 'scene' : 'chapter',
  );
  const [parentId, setParentId] = useState(
    node?.type === 'chapter' && node.mode === 'scenes'
      ? node.id
      : snapshot.nodes.find((parent) => parent.id === node?.parentId)?.type ===
          'chapter'
        ? ''
        : (node?.parentId ?? ''),
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<{ sceneId: string; revision: number }>();
  async function run(operation: () => Promise<void>) {
    setBusy(true);
    try {
      await flush();
      await operation();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  const parents = snapshot.nodes.filter(
    (candidate) =>
      !candidate.deletedAt &&
      parentChildMatrix[candidate.type].includes(type) &&
      (candidate.type !== 'chapter' || candidate.mode === 'scenes'),
  );
  const projectId = snapshot.project.id;
  return (
    <Modal
      title={mode === 'create' ? 'Nuovo elemento' : 'Organizza manoscritto'}
      onClose={onClose}
    >
      {error && <p role="alert">{error}</p>}
      {mode === 'create' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(async () => {
              const id = await projectService.addNode(
                projectId,
                parentId || null,
                type,
                String(data.get('title')),
                data.get('mode') === 'scenes' ? 'scenes' : 'direct',
              );
              onDone(id);
            });
          }}
        >
          <label>
            Titolo
            <input name="title" required maxLength={500} autoFocus />
          </label>
          <label>
            Tipo
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as NodeType);
                setParentId('');
              }}
            >
              <option value="volume">Volume</option>
              <option value="part">Parte</option>
              <option value="chapter">Capitolo</option>
              <option value="scene">Scena</option>
              <option value="folder">Cartella</option>
            </select>
          </label>
          <label>
            Contenitore
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="" disabled={type === 'scene'}>
                Radice del progetto
              </option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.title}
                </option>
              ))}
            </select>
          </label>
          {type === 'chapter' && (
            <label>
              Contenuto
              <select name="mode">
                <option value="direct">Testo diretto</option>
                <option value="scenes">Scene</option>
              </select>
            </label>
          )}
          <button className="filled-button" disabled={busy}>
            Crea elemento
          </button>
        </form>
      ) : (
        <>
          {node && !node.deletedAt && (
            <>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  void run(async () => {
                    await projectService.updateNode(projectId, node.id, {
                      title: String(data.get('title')),
                      synopsis: String(data.get('synopsis')),
                      status: String(data.get('status')) as WritingStatus,
                    });
                    onDone(node.id);
                  });
                }}
              >
                <label>
                  Titolo
                  <input
                    name="title"
                    defaultValue={node.title}
                    required
                    maxLength={500}
                  />
                </label>
                <label>
                  Stato
                  <select name="status" defaultValue={node.status}>
                    {Object.entries(writingStatusLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Sinossi
                  <textarea
                    name="synopsis"
                    defaultValue={node.synopsis}
                    rows={4}
                  />
                </label>
                <button className="filled-button" disabled={busy}>
                  Salva dettagli
                </button>
              </form>
              <fieldset>
                <legend>Sposta o riordina (anche da tastiera)</legend>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    void run(async () => {
                      await projectService.moveNode(
                        projectId,
                        node.id,
                        String(data.get('target')) || null,
                        Number(data.get('position')) - 1,
                      );
                      onDone(node.id);
                    });
                  }}
                >
                  <label>
                    Nuovo contenitore
                    <select name="target" defaultValue={node.parentId ?? ''}>
                      <option value="" disabled={node.type === 'scene'}>
                        Radice del progetto
                      </option>
                      {snapshot.nodes
                        .filter(
                          (candidate) =>
                            candidate.id !== node.id &&
                            !candidate.deletedAt &&
                            parentChildMatrix[candidate.type].includes(
                              node.type,
                            ) &&
                            (candidate.type !== 'chapter' ||
                              candidate.mode === 'scenes'),
                        )
                        .map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Posizione (da 1)
                    <input
                      name="position"
                      type="number"
                      min={1}
                      defaultValue={node.order + 1}
                      required
                    />
                  </label>
                  <button disabled={busy}>Sposta elemento</button>
                </form>
              </fieldset>
              <div className="dialog-actions">
                {['chapter', 'scene'].includes(node.type) && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        onDone(await duplicateNode(projectId, node.id));
                      })
                    }
                  >
                    Duplica elemento
                  </button>
                )}
                {node.type === 'chapter' && node.mode === 'direct' && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Convertire il capitolo in scene? Tutto il testo sarà conservato in Scena 1.',
                        )
                      ) {
                        void run(async () => {
                          setUndo(
                            await projectService.convertToScenes(
                              projectId,
                              node.id,
                            ),
                          );
                        });
                      }
                    }}
                  >
                    Converti in scene
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Spostare “${node.title}” e i suoi figli nel cestino?`,
                      )
                    ) {
                      void run(async () => {
                        await projectService.setNodeDeleted(
                          projectId,
                          node.id,
                          true,
                        );
                        onDone();
                      });
                    }
                  }}
                >
                  Sposta nel cestino
                </button>
              </div>
            </>
          )}
          {undo && node && (
            <button
              onClick={() =>
                void run(async () => {
                  await projectService.undoConversion(
                    projectId,
                    node.id,
                    undo.sceneId,
                    undo.revision,
                  );
                  onDone(node.id);
                })
              }
            >
              Annulla conversione
            </button>
          )}
          <h3>Cestino elementi</h3>
          <ul className="trash-list">
            {snapshot.nodes
              .filter(
                (item) =>
                  item.deletedAt &&
                  !snapshot.nodes.find((parent) => parent.id === item.parentId)
                    ?.deletedAt,
              )
              .map((item) => (
                <li key={item.id}>
                  {item.title}
                  <button
                    onClick={() =>
                      void run(async () => {
                        await projectService.setNodeDeleted(
                          projectId,
                          item.id,
                          false,
                        );
                        onDone(item.id);
                      })
                    }
                  >
                    Ripristina
                  </button>
                </li>
              ))}
          </ul>
          {!node && (
            <p>
              Seleziona un elemento per modificarlo o ripristinalo dal cestino.
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
