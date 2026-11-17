import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { editorExtensions } from '../../modules/editor/extensions';
import { Icon } from '../common/Icon';
import { EditorTools } from './EditorTools';
import { defaultRules, type RuleSettings } from '../../modules/rules/engine';

export function WritingEditor({
  document,
  content,
  onChange,
  statusLabel = 'prima stesura',
  rules = () => defaultRules,
  diagnosticSettings = defaultRules,
}: {
  document: { title: string; kind: string; path: string };
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  statusLabel?: string;
  rules?: () => RuleSettings;
  diagnosticSettings?: RuleSettings;
}) {
  const editor = useEditor({
    extensions: editorExtensions(rules),
    content,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': `Testo · ${document.title}`,
        'aria-multiline': 'true',
        'aria-describedby': 'editing-notice',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getJSON()),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive('bold') ?? false,
      italic: current?.isActive('italic') ?? false,
      list: current?.isActive('bulletList') ?? false,
      underline: current?.isActive('underline') ?? false,
      ordered: current?.isActive('orderedList') ?? false,
      heading: Number(current?.getAttributes('heading').level ?? 0),
    }),
  });
  return (
    <main
      className="writing-main live-editor"
      id="writing-main"
      tabIndex={-1}
      aria-label="Area di scrittura"
    >
      <div
        className="writing-toolbar"
        role="group"
        aria-label="Formattazione testo"
      >
        <button
          className="icon-button format-bold"
          aria-label="Grassetto"
          aria-pressed={state?.bold ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <span aria-hidden="true">B</span>
        </button>
        <button
          className="icon-button format-italic"
          aria-label="Corsivo"
          aria-pressed={state?.italic ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span aria-hidden="true">I</span>
        </button>
        <button
          className="icon-button"
          aria-label="Elenco puntato"
          aria-pressed={state?.list ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <Icon name="list" />
        </button>
        <>
          <button
            className="icon-button"
            aria-label="Sottolineato"
            aria-pressed={state?.underline ?? false}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <u aria-hidden="true">U</u>
          </button>
          <button
            className="icon-button"
            aria-label="Elenco numerato"
            aria-pressed={state?.ordered ?? false}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <Icon name="numbered" />
          </button>
        </>
        <span className="action-separator" />
        <button
          className="icon-button"
          aria-label="Annulla"
          title="Annulla"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Icon name="undo" />
        </button>
        <button
          className="icon-button"
          aria-label="Ripeti"
          title="Ripeti"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Icon name="redo" />
        </button>
        <select
          aria-label="Stile paragrafo"
          value={state?.heading ?? 0}
          onChange={(event) => {
            const level = Number(event.target.value);
            if (level === 0) {
              editor?.chain().focus().setParagraph().run();
            } else {
              editor
                ?.chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 })
                .run();
            }
          }}
        >
          <option value={0}>Testo</option>
          <option value={1}>Titolo 1</option>
          <option value={2}>Titolo 2</option>
          <option value={3}>Titolo 3</option>
        </select>
        <span className="toolbar-caption">Uno spazio per le tue parole</span>
      </div>
      {editor && <EditorTools editor={editor} settings={diagnosticSettings} />}
      <div className="editor-scroll">
        <article className="manuscript-page">
          <p className="document-breadcrumb">{document.path}</p>
          <h1>{document.title}</h1>
          <p className="document-kind">
            {document.kind} · {statusLabel} <span aria-hidden="true">—</span>{' '}
            manoscritto
          </p>
          <EditorContent editor={editor} />
          <p className="editing-notice" id="editing-notice">
            Salvataggio automatico sul dispositivo. Crea regolarmente un backup
            del progetto.
          </p>
        </article>
      </div>
    </main>
  );
}
