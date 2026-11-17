import type { Node } from '@tiptap/pm/model';

export function textBlocks(document: Node) {
  const blocks: { text: string; from: number }[] = [];
  document.descendants((node, pos) => {
    if (node.isTextblock) {
      blocks.push({
        text: node.textBetween(0, node.content.size, '\n', '\ufffc'),
        from: pos + 1,
      });
      return false;
    }
    return true;
  });
  return blocks;
}
export function findRanges(document: Node, query: string) {
  if (!query) {
    return [];
  }
  const ranges: { from: number; to: number }[] = [];
  for (const block of textBlocks(document)) {
    for (
      let index = block.text.indexOf(query);
      index >= 0;
      index = block.text.indexOf(query, index + query.length)
    ) {
      ranges.push({
        from: block.from + index,
        to: block.from + index + query.length,
      });
    }
  }
  return ranges;
}
