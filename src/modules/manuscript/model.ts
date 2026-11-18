import type { JSONContent } from '@tiptap/core';

export type NodeType = 'volume' | 'part' | 'chapter' | 'scene' | 'folder';
export interface Project {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
export interface ManuscriptNode {
  id: string;
  projectId: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  order: number;
  synopsis: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  mode?: 'direct' | 'scenes';
  documentId?: string;
}
export interface ManuscriptDocument {
  id: string;
  projectId: string;
  ownerNodeId: string;
  contentFormat: 'tiptap-json';
  content: JSONContent;
  revision: number;
  updatedAt: string;
}
export interface ReferenceRecord {
  deletedAt?: string;
  id: string;
  projectId: string;
  kind: 'character' | 'location' | 'object';
  name: string;
  description: string;
  notes: string;
  fields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}
export interface Note {
  deletedAt?: string;
  id: string;
  projectId: string;
  title: string;
  body: string;
  kind: 'project_note' | 'research' | 'synopsis';
  linkedNodeIds: string[];
  linkedReferenceIds: string[];
  createdAt: string;
  updatedAt: string;
}
export interface EntityRelation {
  id: string;
  projectId: string;
  sourceType: 'node' | 'reference' | 'note';
  sourceId: string;
  targetType: 'node' | 'reference' | 'note';
  targetId: string;
  relationType: 'mentions' | 'appears_in' | 'related_to' | 'custom';
}
export interface ProjectSnapshot {
  project: Project;
  nodes: ManuscriptNode[];
  documents: ManuscriptDocument[];
  references: ReferenceRecord[];
  notes: Note[];
  relations: EntityRelation[];
  settings: Record<string, string>;
}
export const emptyContent = (): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});
export const liveNodes = (snapshot: ProjectSnapshot) =>
  snapshot.nodes.filter((node) => !node.deletedAt);
export const childrenOf = (nodes: ManuscriptNode[], parentId: string | null) =>
  nodes
    .filter((node) => node.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
