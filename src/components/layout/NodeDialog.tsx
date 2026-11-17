import { t } from '../../i18n';
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
      title={
        mode === 'create'
          ? t('nuovo_elemento_8c610b')
          : t('organizza_manoscritto_1d3ee8')
      }
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
            {t('titolo_d8f4ee')}
            <input name="title" required maxLength={500} autoFocus />
          </label>
          <label>
            {t('tipo_3868d2')}
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as NodeType);
                setParentId('');
              }}
            >
              <option value="volume">{t('volume_b10fb9')}</option>
              <option value="part">{t('parte_2d03d9')}</option>
              <option value="chapter">{t('capitolo_288e49')}</option>
              <option value="scene">{t('scena_48829c')}</option>
              <option value="folder">{t('cartella_2e95e4')}</option>
            </select>
          </label>
          <label>
            {t('contenitore_b722ba')}
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="" disabled={type === 'scene'}>
                {t('radice_del_progetto_9fe616')}
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
              {t('contenuto_18a65b')}
              <select name="mode">
                <option value="direct">{t('testo_diretto_d6d1bf')}</option>
                <option value="scenes">{t('scene_477e5a')}</option>
              </select>
            </label>
          )}
          <button className="filled-button" disabled={busy}>
            {t('crea_elemento_de689e')}
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
                  {t('titolo_d8f4ee')}
                  <input
                    name="title"
                    defaultValue={node.title}
                    required
                    maxLength={500}
                  />
                </label>
                <label>
                  {t('stato_5d7880')}
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
                  {t('sinossi_a1336d')}
                  <textarea
                    name="synopsis"
                    defaultValue={node.synopsis}
                    rows={4}
                  />
                </label>
                <button className="filled-button" disabled={busy}>
                  {t('salva_dettagli_faaf09')}
                </button>
              </form>
              <fieldset>
                <legend>
                  {t('sposta_o_riordina_anche_da_tastiera_48e3bf')}
                </legend>
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
                    {t('nuovo_contenitore_acabc2')}
                    <select name="target" defaultValue={node.parentId ?? ''}>
                      <option value="" disabled={node.type === 'scene'}>
                        {t('radice_del_progetto_9fe616')}
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
                    {t('posizione_da_1_5705ea')}
                    <input
                      name="position"
                      type="number"
                      min={1}
                      defaultValue={node.order + 1}
                      required
                    />
                  </label>
                  <button disabled={busy}>{t('sposta_elemento_49bf03')}</button>
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
                    {t('duplica_elemento_b9bee0')}
                  </button>
                )}
                {node.type === 'chapter' && node.mode === 'direct' && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          t(
                            'convertire_il_capitolo_in_scene_tutto_il_testo_sara_conservato_in_4593fd',
                          ),
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
                    {t('converti_in_scene_145f9f')}
                  </button>
                )}
                <button
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        t('spostare_value0_e_i_suoi_figli_nel_cestino_fafb9a', {
                          value0: node.title,
                        }),
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
                  {t('sposta_nel_cestino_dd41b3')}
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
              {t('annulla_conversione_965c5f')}
            </button>
          )}
          <h3>{t('cestino_elementi_4b985e')}</h3>
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
                    {t('ripristina_cf1718')}
                  </button>
                </li>
              ))}
          </ul>
          {!node && (
            <p>
              {t(
                'seleziona_un_elemento_per_modificarlo_o_ripristinalo_dal_cestino_038481',
              )}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
