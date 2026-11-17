import { t } from '../../i18n';
import type { JSONContent } from '@tiptap/core';
import {
  childrenOf,
  liveNodes,
  type ProjectSnapshot,
} from '../manuscript/model';

export interface ExportOptions {
  scope: string[];
  includeProjectTitle: boolean;
  includeSceneTitles: boolean;
  chapterSeparator: string;
}
export interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
}
export interface ExportBlock {
  runs: TextSegment[];
  heading?: 'volume' | 'part' | 'chapter' | 'scene' | 'body';
  level?: number;
  list?: { level: number; ordered: boolean; reference: string; start: number };
  quote?: boolean;
  listContinuationLevel?: number;
}
export const defaultExportOptions: ExportOptions = {
  scope: [],
  includeProjectTitle: true,
  includeSceneTitles: false,
  chapterSeparator: '* * *',
};

function segments(node: JSONContent): TextSegment[] {
  if (node.type === 'hardBreak') {
    return [{ text: '\n' }];
  }
  if (node.type === 'text') {
    const marks = new Set(node.marks?.map((mark) => mark.type));
    return [
      {
        text: node.text ?? '',
        bold: marks.has('bold'),
        italic: marks.has('italic'),
        underline: marks.has('underline'),
        strike: marks.has('strike'),
      },
    ];
  }
  return (node.content ?? []).flatMap(segments);
}
export function serializeBlocks(content: JSONContent): ExportBlock[] {
  let listCounter = 0;
  function visit(
    node: JSONContent,
    list?: ExportBlock['list'],
    quote = false,
  ): ExportBlock[] {
    if (['paragraph', 'heading'].includes(node.type ?? '')) {
      return [
        {
          runs: segments(node),
          ...(node.type === 'heading'
            ? {
                heading: 'body' as const,
                level: Number(node.attrs?.level ?? 1),
              }
            : {}),
          ...(list ? { list } : {}),
          ...(quote ? { quote: true } : {}),
        },
      ];
    }
    if (node.type === 'horizontalRule') {
      return [{ runs: [{ text: '—' }] }];
    }
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      const reference = `list-${++listCounter}`;
      return (node.content ?? []).flatMap((item) =>
        visit(
          item,
          {
            level: list ? list.level + 1 : 0,
            ordered: node.type === 'orderedList',
            start: Number(node.attrs?.start ?? 1),
            reference,
          },
          quote,
        ),
      );
    }
    if (node.type === 'listItem') {
      return (node.content ?? []).flatMap((item, index) => {
        const continuation =
          index > 0 && !['bulletList', 'orderedList'].includes(item.type ?? '');
        return visit(item, continuation ? undefined : list, quote).map(
          (block) =>
            continuation && list && !block.list
              ? { ...block, listContinuationLevel: list.level }
              : block,
        );
      });
    }
    return (node.content ?? []).flatMap((child) =>
      visit(child, list, quote || node.type === 'blockquote'),
    );
  }
  return visit(content);
}

export function manuscriptBlocks(
  snapshot: ProjectSnapshot,
  options: ExportOptions,
): ExportBlock[] {
  const nodes = liveNodes(snapshot);
  if (options.scope.some((id) => !nodes.some((node) => node.id === id))) {
    throw new Error(
      t(
        'uno_degli_elementi_selezionati_non_e_piu_disponibile_rivedi_l_amb_8901e9',
      ),
    );
  }
  const documents = new Map(
    snapshot.documents.map((document) => [document.id, document]),
  );
  const blocks: ExportBlock[] = [];
  if (options.includeProjectTitle) {
    blocks.push({
      heading: 'volume',
      runs: [{ text: snapshot.project.title }],
    });
  }
  function walk(parentId: string | null, inherited: boolean) {
    for (const node of childrenOf(nodes, parentId)) {
      const included = inherited || options.scope.includes(node.id);
      if (
        included &&
        node.type !== 'folder' &&
        (node.type !== 'scene' || options.includeSceneTitles)
      ) {
        blocks.push({
          heading: node.type,
          runs: [{ text: node.title }],
        });
      }
      if (included && node.documentId) {
        const document = documents.get(node.documentId);
        if (!document) {
          throw new Error(
            t('documento_mancante_value0_a6932e', { value0: node.title }),
          );
        }
        // Identificatori delle liste indipendenti anche tra documenti diversi.
        const body = serializeBlocks(document.content).map((block) =>
          block.list
            ? {
                ...block,
                list: {
                  ...block.list,
                  reference: `${document.id}-${block.list.reference}`,
                },
              }
            : block,
        );
        blocks.push(...body);
      }
      walk(node.id, included);
    }
  }
  walk(null, options.scope.length === 0);
  return blocks;
}
export function toTxt(
  snapshot: ProjectSnapshot,
  options: ExportOptions,
): string {
  const blocks = manuscriptBlocks(snapshot, options);
  const counters = new Map<string, number>();
  let chapterSeen = false;
  return (
    blocks
      .map((block) => {
        let prefix = '';
        if (block.list) {
          const index = counters.get(block.list.reference) ?? block.list.start;
          counters.set(block.list.reference, index + 1);
          prefix = `${'  '.repeat(block.list.level)}${block.list.ordered ? `${index}.` : '•'} `;
        }
        if (block.listContinuationLevel !== undefined) {
          prefix = '  '.repeat(block.listContinuationLevel + 1);
        }
        if (block.heading === 'chapter') {
          prefix = chapterSeen ? `${options.chapterSeparator}\n\n` : '';
          chapterSeen = true;
        }
        return prefix + block.runs.map((run) => run.text).join('');
      })
      .join('\n\n') + '\n'
  );
}
export function safeFilename(title: string) {
  const sanitized = Array.from(title)
    .map((character) => (character.codePointAt(0)! < 32 ? '-' : character))
    .join('')
    .replace(/[<>:"/\\|?*]/gu, '-');
  const name =
    sanitized
      .trim()
      .slice(0, 120)
      .replace(/[. ]+$/gu, '') || t('genowrite_882e29');
  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(name)
    ? `_${name}`
    : name;
}
