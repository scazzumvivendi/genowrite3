import type { ProjectSnapshot } from '../manuscript/model';
import { plainText } from '../statistics/counts';

export interface SearchResult {
  id: string;
  type: 'node' | 'reference' | 'note';
  title: string;
  excerpt: string;
}
export function searchProject(
  snapshot: ProjectSnapshot,
  query: string,
): SearchResult[] {
  const needle = query.trim().toLocaleLowerCase('it');
  if (!needle) {
    return [];
  }
  const entries: SearchResult[] = [
    ...snapshot.nodes
      .filter((node) => !node.deletedAt)
      .map((node) => ({
        id: node.id,
        type: 'node' as const,
        title: node.title,
        excerpt: [
          node.synopsis,
          ...snapshot.documents
            .filter((document) => document.id === node.documentId)
            .map((document) => plainText(document.content)),
        ].join('\n'),
      })),
    ...snapshot.references
      .filter((record) => !record.deletedAt)
      .map((record) => ({
        id: record.id,
        type: 'reference' as const,
        title: record.name,
        excerpt: `${record.description}\n${record.notes}\n${Object.values(record.fields).join(' ')}`,
      })),
    ...snapshot.notes
      .filter((note) => !note.deletedAt)
      .map((note) => ({
        id: note.id,
        type: 'note' as const,
        title: note.title,
        excerpt: note.body,
      })),
  ];
  return entries
    .filter((entry) =>
      `${entry.title}\n${entry.excerpt}`
        .toLocaleLowerCase('it')
        .includes(needle),
    )
    .map((entry) => {
      const index = Math.max(
        0,
        entry.excerpt.toLocaleLowerCase('it').indexOf(needle) - 40,
      );
      return { ...entry, excerpt: entry.excerpt.slice(index, index + 180) };
    });
}
