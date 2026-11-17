import { t } from '../../i18n';
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
  statusLabel = t('prima_stesura_562f06'),
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
        'aria-label': t('testo_value0_af791a', { value0: document.title }),
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
      aria-label={t('area_di_scrittura_6f4475')}
    >
      <div
        className="writing-toolbar"
        role="group"
        aria-label={t('formattazione_testo_406aae')}
      >
        <button
          className="icon-button format-bold"
          aria-label={t('grassetto_7b71a1')}
          aria-pressed={state?.bold ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <span aria-hidden="true">{t('b_df7e70')}</span>
        </button>
        <button
          className="icon-button format-italic"
          aria-label={t('corsivo_9ca55c')}
          aria-pressed={state?.italic ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span aria-hidden="true">{t('i_a83dd0')}</span>
        </button>
        <button
          className="icon-button"
          aria-label={t('elenco_puntato_ee2081')}
          aria-pressed={state?.list ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <Icon name="list" />
        </button>
        <>
          <button
            className="icon-button"
            aria-label={t('sottolineato_be834f')}
            aria-pressed={state?.underline ?? false}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <u aria-hidden="true">{t('u_a25513')}</u>
          </button>
          <button
            className="icon-button"
            aria-label={t('elenco_numerato_6f95a7')}
            aria-pressed={state?.ordered ?? false}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <Icon name="numbered" />
          </button>
        </>
        <span className="action-separator" />
        <button
          className="icon-button"
          aria-label={t('annulla_18c9d9')}
          title={t('annulla_18c9d9')}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Icon name="undo" />
        </button>
        <button
          className="icon-button"
          aria-label={t('ripeti_6e8834')}
          title={t('ripeti_6e8834')}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Icon name="redo" />
        </button>
        <select
          aria-label={t('stile_paragrafo_27eb83')}
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
          <option value={0}>{t('testo_ebb9e6')}</option>
          <option value={1}>{t('titolo_1_4f52f1')}</option>
          <option value={2}>{t('titolo_2_210acf')}</option>
          <option value={3}>{t('titolo_3_9f4bf0')}</option>
        </select>
        <span className="toolbar-caption">
          {t('uno_spazio_per_le_tue_parole_08b26e')}
        </span>
      </div>
      {editor && <EditorTools editor={editor} settings={diagnosticSettings} />}
      <div className="editor-scroll">
        <article className="manuscript-page">
          <p className="document-breadcrumb">{document.path}</p>
          <h1>{document.title}</h1>
          <p className="document-kind">
            {document.kind} · {statusLabel} <span aria-hidden="true">—</span>{' '}
            {t('manoscritto_edb027')}
          </p>
          <EditorContent editor={editor} />
          <p className="editing-notice" id="editing-notice">
            {t(
              'salvataggio_automatico_sul_dispositivo_crea_regolarmente_un_backu_1cba00',
            )}
          </p>
        </article>
      </div>
    </main>
  );
}
