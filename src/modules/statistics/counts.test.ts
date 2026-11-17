import { expect, it } from 'vitest';
import {
  countText,
  countContent,
  plainText,
  readingMinutes,
  projectCounts,
} from './counts';
import type { ProjectSnapshot } from '../manuscript/model';

it('conta apostrofi italiani, Unicode, spazi e paragrafi in modo esplicito', () => {
  expect(countText("L’acqua e' blu 🐈")).toEqual({ words: 3, characters: 16 });
  const content = {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Uno' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Due' }] },
    ],
  };
  expect(plainText(content)).toBe('Uno\nDue');
  expect(countContent(content)).toEqual({ words: 2, characters: 7 });
  expect(readingMinutes(0, 200)).toBe(0);
  expect(readingMinutes(201, 200)).toBe(2);
});
it('il progetto conta una sola volta documenti attivi ed esclude cestino e riferimenti', () => {
  const snapshot = {
    nodes: [
      { id: 'chapter', type: 'chapter', mode: 'scenes' },
      { id: 'scene', type: 'scene', parentId: 'chapter', documentId: 'doc' },
      { id: 'deleted', documentId: 'old', deletedAt: 'today' },
    ],
    documents: [
      {
        id: 'doc',
        revision: 1,
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Due parole' }],
            },
          ],
        },
      },
      { id: 'old', revision: 1, content: { type: 'text', text: 'Escluso' } },
    ],
    notes: [{ body: 'Non contare queste parole' }],
    references: [{ description: 'Non contare neppure queste' }],
  } as unknown as ProjectSnapshot;
  expect(projectCounts(snapshot, []).total.words).toBe(2);
  expect(
    projectCounts(snapshot, [
      { id: 'doc', projectId: '', revision: 0, words: 999, characters: 999 },
    ]).total.words,
  ).toBe(2);
  expect(
    projectCounts(
      snapshot,
      [],
      new Map([['doc', { words: 3, characters: 15 }]]),
    ).total.words,
  ).toBe(3);
});
