import { useState } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import { diagnose, type RuleSettings } from '../../modules/rules/engine';
import { findRanges, textBlocks } from '../../modules/editor/text-ranges';

export function EditorTools({
  editor,
  settings,
}: {
  editor: Editor;
  settings: RuleSettings;
}) {
  const [panel, setPanel] = useState<'find' | 'diagnostics'>();
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [ignored, setIgnored] = useState<string[]>([]);
  const text = useEditorState({
    editor,
    selector: ({ editor: current }) => current.state.doc,
  });
  const matches = findRanges(text, query);
  const diagnostics = textBlocks(text).flatMap((block) =>
    diagnose(block.text, settings).map((issue) => ({
      ...issue,
      from: block.from + issue.from,
      to: block.from + issue.to,
    })),
  );
  const visible = diagnostics.filter(
    (issue) =>
      !ignored.includes(
        `${issue.kind}:${issue.from}:${issue.to}:${issue.message}`,
      ),
  );
  function replaceAll() {
    const transaction = editor.state.tr;
    for (const match of [...matches].reverse()) {
      transaction.insertText(replacement, match.from, match.to);
    }
    editor.view.dispatch(transaction);
    editor.commands.focus();
  }
  return (
    <div className="editor-tools">
      <div className="editor-tools-heading">
        <button
          aria-expanded={panel === 'find'}
          onClick={() => setPanel(panel === 'find' ? undefined : 'find')}
        >
          Trova e sostituisci
        </button>
        <button
          aria-expanded={panel === 'diagnostics'}
          onClick={() =>
            setPanel(panel === 'diagnostics' ? undefined : 'diagnostics')
          }
        >
          Segnalazioni ({visible.length})
        </button>
      </div>
      {panel === 'find' && (
        <div className="find-panel">
          <label>
            Trova nel documento
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Sostituisci con
            <input
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
            />
          </label>
          <span>
            {matches.length} risultati · distingue maiuscole/minuscole
          </span>
          <button
            disabled={!matches.length}
            onClick={() => {
              const match =
                matches.find(
                  (item) => item.from > editor.state.selection.from,
                ) ?? matches[0]!;
              editor
                .chain()
                .focus()
                .setTextSelection(match)
                .scrollIntoView()
                .run();
            }}
          >
            Successivo
          </button>
          <button
            disabled={!matches.length}
            onClick={() => {
              const match =
                matches.find(
                  (item) => item.from >= editor.state.selection.from,
                ) ?? matches[0]!;
              editor.view.dispatch(
                editor.state.tr.insertText(replacement, match.from, match.to),
              );
              editor.commands.focus();
            }}
          >
            Sostituisci
          </button>
          <button disabled={!matches.length} onClick={replaceAll}>
            Sostituisci tutti
          </button>
        </div>
      )}
      {panel === 'diagnostics' && (
        <ul className="diagnostics-list">
          {visible.slice(0, 100).map((issue) => (
            <li key={`${issue.kind}:${issue.from}:${issue.to}`}>
              <button
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .setTextSelection({ from: issue.from, to: issue.to })
                    .scrollIntoView()
                    .run()
                }
              >
                {issue.message}
              </button>
              <button
                onClick={() =>
                  setIgnored([
                    ...ignored,
                    `${issue.kind}:${issue.from}:${issue.to}:${issue.message}`,
                  ])
                }
              >
                Ignora
              </button>
            </li>
          ))}
          {!visible.length && <li>Nessuna segnalazione.</li>}
          {visible.length > 100 && <li>Mostrate le prime 100 segnalazioni.</li>}
        </ul>
      )}
    </div>
  );
}
