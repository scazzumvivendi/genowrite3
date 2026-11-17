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
    throw new Error('Il titolo deve contenere da 1 a 500 caratteri.');
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
    throw new Error('Contenitore non disponibile.');
  }
  if (!parentChildMatrix[parent?.type ?? 'project'].includes(type)) {
    throw new Error(
      'Questa posizione non ammette il tipo di elemento selezionato.',
    );
  }
  if (parent?.type === 'chapter' && parent.mode !== 'scenes') {
    throw new Error('Converti prima il capitolo in modalità scene.');
  }
  const visited = new Set<string>(movingId ? [movingId] : []);
  let ancestor = parent;
  while (ancestor) {
    if (visited.has(ancestor.id)) {
      throw new Error('Lo spostamento creerebbe un ciclo.');
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
      throw new Error('Documento JSON non valido o troppo complesso.');
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
      throw new Error('Tipo di contenuto non supportato.');
    }
    if (
      Object.keys(node).some(
        (key) => !['type', 'content', 'text', 'marks', 'attrs'].includes(key),
      )
    ) {
      throw new Error('Campo documento non supportato.');
    }
    if (
      node.type === 'text' &&
      (typeof node.text !== 'string' || !node.text.length)
    ) {
      throw new Error('Testo non valido.');
    }
    if (node.text !== undefined && node.type !== 'text') {
      throw new Error('Testo in posizione non valida.');
    }
    if (node.attrs !== undefined) {
      if (
        !node.attrs ||
        typeof node.attrs !== 'object' ||
        Array.isArray(node.attrs)
      ) {
        throw new Error('Attributi non validi.');
      }
      const attrs = node.attrs as Record<string, unknown>;
      if (node.type === 'heading') {
        if (
          Object.keys(attrs).some((key) => key !== 'level') ||
          ![1, 2, 3].includes(Number(attrs.level))
        ) {
          throw new Error('Titolo non supportato.');
        }
      } else if (node.type === 'orderedList') {
        if (
          Object.keys(attrs).some((key) => key !== 'start' && key !== 'type') ||
          !Number.isInteger(attrs.start) ||
          Number(attrs.start) < 1 ||
          (attrs.type !== undefined && attrs.type !== null)
        ) {
          throw new Error('Elenco non valido.');
        }
      } else if (Object.keys(attrs).length) {
        throw new Error('Attributi non supportati.');
      }
    }
    if (node.marks !== undefined) {
      if (!Array.isArray(node.marks) || node.type !== 'text') {
        throw new Error('Formattazione non valida.');
      }
      for (const mark of node.marks) {
        if (
          !mark ||
          typeof mark !== 'object' ||
          !['bold', 'italic', 'underline', 'strike'].includes(mark.type) ||
          Object.keys(mark).some((key) => key !== 'type')
        ) {
          throw new Error('Formattazione non supportata.');
        }
      }
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content) || !allowed[node.type]?.length) {
        throw new Error('Contenuto non valido.');
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
      throw new Error('Struttura documento vuota.');
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
      throw new Error('Identificatore mancante o duplicato.');
    }
    ids.add(item.id);
    if ('projectId' in item && item.projectId !== project.id) {
      throw new Error('Entità appartenente a un altro progetto.');
    }
  }
  for (const node of nodes) {
    requireTitle(node.title);
    if (
      !['planned', 'in_progress', 'first_draft', 'revised', 'final'].includes(
        node.status,
      )
    ) {
      throw new Error('Stato di scrittura non valido.');
    }
    if (!Number.isFinite(node.order)) {
      throw new Error('Ordine non valido.');
    }
    if (
      node.parentId !== null &&
      !nodes.some((parent) => parent.id === node.parentId)
    ) {
      throw new Error('Genitore mancante.');
    }
    const ancestors = new Set([node.id]);
    let parentId = node.parentId;
    while (parentId !== null) {
      if (ancestors.has(parentId)) {
        throw new Error('Ciclo nella gerarchia.');
      }
      ancestors.add(parentId);
      if (ancestors.size > 64) {
        throw new Error('Gerarchia troppo profonda (massimo 64 livelli).');
      }
      parentId =
        nodes.find((parent) => parent.id === parentId)?.parentId ?? null;
    }
    if (!node.deletedAt) {
      assertParent(nodes, node.type, node.parentId, node.id);
    }
    if (node.type === 'chapter') {
      if (!['direct', 'scenes'].includes(node.mode ?? '')) {
        throw new Error('Modalità capitolo non valida.');
      }
      if (
        node.mode === 'direct' &&
        nodes.some((child) => child.parentId === node.id && !child.deletedAt)
      ) {
        throw new Error('Un capitolo diretto non può avere scene.');
      }
    }
    const owned = documents.filter((doc) => doc.ownerNodeId === node.id);
    if (
      node.type === 'scene' ||
      (node.type === 'chapter' && node.mode === 'direct')
    ) {
      if (owned.length !== 1 || owned[0]?.id !== node.documentId) {
        throw new Error('Documento del nodo mancante o duplicato.');
      }
    } else if (owned.length || node.documentId) {
      throw new Error('Documento in un contenitore non testuale.');
    }
  }
  for (const doc of documents) {
    if (
      !nodes.some((node) => node.id === doc.ownerNodeId) ||
      doc.contentFormat !== 'tiptap-json' ||
      !Number.isInteger(doc.revision) ||
      doc.revision < 0
    ) {
      throw new Error('Documento orfano o revisione non valida.');
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
      throw new Error('Collegamento orfano.');
    }
  }
  for (const note of snapshot.notes) {
    if (
      note.linkedNodeIds.some((id) => !entityExists('node', id)) ||
      note.linkedReferenceIds.some((id) => !entityExists('reference', id))
    ) {
      throw new Error('Nota con collegamenti mancanti.');
    }
  }
}
