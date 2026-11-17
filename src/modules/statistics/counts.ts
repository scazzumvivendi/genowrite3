import type { JSONContent } from '@tiptap/core';
import type { ProjectSnapshot } from '../manuscript/model';

export interface Counts {
  words: number;
  characters: number;
}
export interface CachedCounts extends Counts {
  id: string;
  projectId: string;
  revision: number;
}
export const zeroCounts = (): Counts => ({ words: 0, characters: 0 });

export function plainText(content: JSONContent): string {
  if (content.type === 'text') {
    return content.text ?? '';
  }
  if (content.type === 'hardBreak') {
    return '\n';
  }
  return (content.content ?? [])
    .map(plainText)
    .join(['paragraph', 'heading'].includes(content.type ?? '') ? '' : '\n');
}
export function countText(text: string): Counts {
  return {
    words: [...text.matchAll(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)].length,
    characters: [...text].length,
  };
}
export const countContent = (content: JSONContent) =>
  countText(plainText(content));
export const readingMinutes = (words: number, wordsPerMinute: number) =>
  Math.ceil(words / Math.max(1, wordsPerMinute));
export function addCounts(values: Counts[]): Counts {
  return values.reduce(
    (sum, value) => ({
      words: sum.words + value.words,
      characters: sum.characters + value.characters,
    }),
    zeroCounts(),
  );
}
export function projectCounts(
  snapshot: ProjectSnapshot,
  cache: CachedCounts[],
  overrides: ReadonlyMap<string, Counts> = new Map(),
) {
  const active = new Set(
    snapshot.nodes
      .filter((node) => !node.deletedAt && node.documentId)
      .map((node) => node.documentId),
  );
  const perDocument = new Map<string, Counts>();
  const byId = new Map(cache.map((entry) => [entry.id, entry]));
  for (const document of snapshot.documents) {
    if (active.has(document.id)) {
      const cached = byId.get(document.id);
      perDocument.set(
        document.id,
        overrides.get(document.id) ??
          (cached?.revision === document.revision
            ? cached
            : countContent(document.content)),
      );
    }
  }
  return { perDocument, total: addCounts([...perDocument.values()]) };
}
