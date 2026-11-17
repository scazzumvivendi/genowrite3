import { Extension, InputRule } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {
  defaultRules,
  transformAtEnd,
  type RuleSettings,
} from '../rules/engine';

export function editorExtensions(
  getSettings: () => RuleSettings = () => defaultRules,
) {
  const typography = Extension.create({
    name: 'localTypography',
    addInputRules() {
      return [
        new InputRule({
          find: (text) => {
            const change = transformAtEnd(text, getSettings());
            return change
              ? {
                  index: change.from,
                  text: text.slice(change.from),
                  data: { replacement: change.replacement },
                }
              : null;
          },
          // Niente ripristino speciale su Backspace; Ctrl+Z usa la cronologia normale.
          undoable: false,
          handler: ({ state, range, match }) => {
            const replacement: unknown = match.data?.replacement;
            if (typeof replacement === 'string') {
              state.tr.insertText(replacement, range.from, range.to);
            }
          },
        }),
      ];
    },
  });
  return [
    StarterKit.configure({
      link: false,
      codeBlock: false,
      code: false,
      heading: { levels: [1, 2, 3] },
    }),
    typography,
  ];
}
