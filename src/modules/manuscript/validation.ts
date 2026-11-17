import { t } from '../../i18n';
import type { JSONContent } from '@tiptap/core';
import type { ManuscriptNode, NodeType, ProjectSnapshot } from './model';

export const parentChildMatrix: Record<
  NodeType | 'project',
  readonly NodeType[]
> = {
  project: ['volume', 'part', 'chapter', 'folder'],
  volume: ['part', 'chapter', 'folder'],
  part: ['chapter', 'folder'],
  chapter: ['scene'],
  scene: [],
  folder: ['chapter', 'folder'],
};
export function requireTitle(title: string) {
  if (!title.trim() || title.length > 500) {
    throw new Error(t('il_titolo_deve_contenere_da_1_a_500_caratteri_12a368'));
  }
}
export function assertParent(
  nodes: ManuscriptNode[],
  type: NodeType,
  parentId: string | null,
  movingId?: string,
) {
  const parent = parentId
    ? nodes.find((node) => node.id === parentId && !node.deletedAt)
    : undefined;
  if (parentId && !parent) {
    throw new Error(t('contenitore_non_disponibile_a039cc'));
  }
  if (!parentChildMatrix[parent?.type ?? 'project'].includes(type)) {
    throw new Error(
      t('questa_posizione_non_ammette_il_tipo_di_elemento_selezionato_aed5e4'),
    );
  }
  if (parent?.type === 'chapter' && parent.mode !== 'scenes') {
    throw new Error(t('converti_prima_il_capitolo_in_modalita_scene_b82c54'));
  }
  const visited = new Set<string>(movingId ? [movingId] : []);
  let ancestor = parent;
  while (ancestor) {
    if (visited.has(ancestor.id)) {
      throw new Error(t('lo_spostamento_creerebbe_un_ciclo_4a412f'));
    }
    visited.add(ancestor.id);
    ancestor = nodes.find((node) => node.id === ancestor?.parentId);
  }
}

/** Schema JSON deliberatamente chiuso: niente HTML, codice, link o attributi eseguibili. */
export function validateContent(value: unknown): asserts value is JSONContent {
  let count = 0;
  function visit(input: unknown, parent: string | null, depth: number) {
    if (
      ++count > 500_000 ||
      depth > 100 ||
      !input ||
      typeof input !== 'object' ||
      Array.isArray(input)
    ) {
      throw new Error(t('documento_json_non_valido_o_troppo_complesso_975699'));
    }
    const node = input as Record<string, unknown>;
    const allowed: Record<string, string[]> = {
      doc: [
        'paragraph',
        'heading',
        'bulletList',
        'orderedList',
        'blockquote',
        'horizontalRule',
      ],
      paragraph: ['text', 'hardBreak'],
      heading: ['text', 'hardBreak'],
      bulletList: ['listItem'],
      orderedList: ['listItem'],
      listItem: ['paragraph', 'bulletList', 'orderedList', 'blockquote'],
      blockquote: ['paragraph', 'heading', 'bulletList', 'orderedList'],
      text: [],
      hardBreak: [],
      horizontalRule: [],
    };
    if (
      typeof node.type !== 'string' ||
      !Object.hasOwn(allowed, node.type) ||
      (parent === null
        ? node.type !== 'doc'
        : !allowed[parent]?.includes(node.type))
    ) {
      throw new Error(t('tipo_di_contenuto_non_supportato_503780'));
    }
    if (
      Object.keys(node).some(
        (key) => !['type', 'content', 'text', 'marks', 'attrs'].includes(key),
      )
    ) {
      throw new Error(t('campo_documento_non_supportato_3c3fe2'));
    }
    if (
      node.type === 'text' &&
      (typeof node.text !== 'string' || !node.text.length)
    ) {
      throw new Error(t('testo_non_valido_3d7e3f'));
    }
    if (node.text !== undefined && node.type !== 'text') {
      throw new Error(t('testo_in_posizione_non_valida_298476'));
    }
    if (node.attrs !== undefined) {
      if (
        !node.attrs ||
        typeof node.attrs !== 'object' ||
        Array.isArray(node.attrs)
      ) {
        throw new Error(t('attributi_non_validi_f13560'));
      }
      const attrs = node.attrs as Record<string, unknown>;
      if (node.type === 'heading') {
        if (
          Object.keys(attrs).some((key) => key !== 'level') ||
          ![1, 2, 3].includes(Number(attrs.level))
        ) {
          throw new Error(t('titolo_non_supportato_b174c0'));
        }
      } else if (node.type === 'orderedList') {
        if (
          Object.keys(attrs).some((key) => key !== 'start' && key !== 'type') ||
          !Number.isInteger(attrs.start) ||
          Number(attrs.start) < 1 ||
          (attrs.type !== undefined && attrs.type !== null)
        ) {
          throw new Error(t('elenco_non_valido_4958b2'));
        }
      } else if (Object.keys(attrs).length) {
        throw new Error(t('attributi_non_supportati_38e2a2'));
      }
    }
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks) || node.type !== 'text') {
        throw new Error(t('formattazione_non_valida_9bd0ed'));
      }
      for (const mark of node.marks) {
        if (
          !mark ||
          typeof mark !== 'object' ||
          !['bold', 'italic', 'underline', 'strike'].includes(mark.type) ||
          Object.keys(mark).some((key) => key !== 'type')
        ) {
          throw new Error(t('formattazione_non_supportata_709788'));
        }
      }
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content) || !allowed[node.type]?.length) {
        throw new Error(t('contenuto_non_valido_b862e7'));
      }
      for (const child of node.content) {
        visit(child, node.type, depth + 1);
      }
    }
    if (
      ['doc', 'bulletList', 'orderedList', 'listItem', 'blockquote'].includes(
        node.type,
      ) &&
      (!Array.isArray(node.content) || !node.content.length)
    ) {
      throw new Error(t('struttura_documento_vuota_41a09d'));
    }
  }
  visit(value, null, 0);
}

export function validateSnapshot(snapshot: ProjectSnapshot) {
  const { project, nodes, documents } = snapshot;
  requireTitle(project.title);
  const ids = new Set<string>();
  for (const item of [
    project,
    ...nodes,
    ...documents,
    ...snapshot.references,
    ...snapshot.notes,
    ...snapshot.relations,
  ]) {
    if (!item.id || ids.has(item.id)) {
      throw new Error(t('identificatore_mancante_o_duplicato_cb77c1'));
    }
    ids.add(item.id);
    if ('projectId' in item && item.projectId !== project.id) {
      throw new Error(t('entita_appartenente_a_un_altro_progetto_8c6b5d'));
    }
  }
  for (const node of nodes) {
    requireTitle(node.title);
    if (
      !['planned', 'in_progress', 'first_draft', 'revised', 'final'].includes(
        node.status,
      )
    ) {
      throw new Error(t('stato_di_scrittura_non_valido_9ad6bc'));
    }
    if (!Number.isFinite(node.order)) {
      throw new Error(t('ordine_non_valido_434675'));
    }
    if (
      node.parentId !== null &&
      !nodes.some((parent) => parent.id === node.parentId)
    ) {
      throw new Error(t('genitore_mancante_94532a'));
    }
    const ancestors = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId !== null) {
      if (ancestors.has(parentId)) {
        throw new Error(t('ciclo_nella_gerarchia_502e40'));
      }
      ancestors.add(parentId);
      if (ancestors.size > 64) {
        throw new Error(
          t('gerarchia_troppo_profonda_massimo_64_livelli_ba6e54'),
        );
      }
      parentId =
        nodes.find((parent) => parent.id === parentId)?.parentId ?? null;
    }
    if (!node.deletedAt) {
      assertParent(nodes, node.type, node.parentId, node.id);
    }
    if (node.type === 'chapter') {
      if (!['direct', 'scenes'].includes(node.mode ?? '')) {
        throw new Error(t('modalita_capitolo_non_valida_cd0c93'));
      }
      if (
        node.mode === 'direct' &&
        nodes.some((child) => child.parentId === node.id && !child.deletedAt)
      ) {
        throw new Error(t('un_capitolo_diretto_non_puo_avere_scene_cb7b3b'));
      }
    }
    const owned = documents.filter((doc) => doc.ownerNodeId === node.id);
    if (
      node.type === 'scene' ||
      (node.type === 'chapter' && node.mode === 'direct')
    ) {
      if (owned.length !== 1 || owned[0]?.id !== node.documentId) {
        throw new Error(t('documento_del_nodo_mancante_o_duplicato_bf945d'));
      }
    } else if (owned.length || node.documentId) {
      throw new Error(t('documento_in_un_contenitore_non_testuale_843d8c'));
    }
  }
  for (const doc of documents) {
    if (
      !nodes.some((node) => node.id === doc.ownerNodeId) ||
      doc.contentFormat !== 'tiptap-json' ||
      !Number.isInteger(doc.revision) ||
      doc.revision < 0
    ) {
      throw new Error(t('documento_orfano_o_revisione_non_valida_142f95'));
    }
    validateContent(doc.content);
  }
  const entityExists = (type: string, id: string) =>
    (type === 'node'
      ? nodes
      : type === 'reference'
        ? snapshot.references
        : type === 'note'
          ? snapshot.notes
          : []
    ).some((item) => item.id === id);
  for (const relation of snapshot.relations) {
    if (
      !entityExists(relation.sourceType, relation.sourceId) ||
      !entityExists(relation.targetType, relation.targetId)
    ) {
      throw new Error(t('collegamento_orfano_7b24a2'));
    }
  }
  for (const note of snapshot.notes) {
    if (
      note.linkedNodeIds.some((id) => !entityExists('node', id)) ||
      note.linkedReferenceIds.some((id) => !entityExists('reference', id))
    ) {
      throw new Error(t('nota_con_collegamenti_mancanti_1401ef'));
    }
  }
}
