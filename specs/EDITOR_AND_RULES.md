# Editor and typography rules

## 1. Editor goals

The editor should feel close to Genowrite 2:

- central clean writing surface;
- readable text column;
- simple toolbar;
- low visual distraction;
- always-visible bottom-left statistics;
- predictable keyboard behavior.

Use TipTap/ProseMirror as the initial candidate, subject to a performance and editing-behavior prototype.

## 2. Supported formatting in v1.0

- Paragraphs
- Bold
- Italic
- Underline
- Ordered lists
- Bullet lists
- Basic headings if needed for internal document structure

Do not implement complex page layout, floating text boxes, columns, tables or Word-like pagination in v1.0 unless explicitly approved.

The chapter/scene title is metadata and must be separate from body content.

## 3. Editor preferences

Allow users to configure:

- font family from locally available/system-safe choices;
- font size;
- line height;
- editor text width;
- light/dark theme.

These are editor display preferences. They do not implicitly set DOCX export formatting.

## 4. Autosave and editor lifecycle

- Debounce persistence after edits.
- Show clear states: saving, saved, save error.
- Flush pending writes before switching documents and during controlled app lifecycle events where possible.
- Do not block every keystroke on IndexedDB.
- Handle transaction errors and storage quota failures.
- Avoid losing the latest edit if the user navigates quickly.
- Mount only the active document editor.

## 5. Typography engine architecture

The rules engine must be independent of React and TipTap UI components.

It should expose:

- rule definitions and metadata;
- enabled/disabled settings;
- transformation functions;
- diagnostic functions;
- exception/configuration support;
- testable input/output behavior.

Distinguish two kinds of rules:

1. Transformations: change text automatically.
2. Diagnostics: report a possible issue without changing text.

Every transformation must define how it handles cursor position, selection, composition/IME input, undo history and exceptions.

Do not run broad transformations over the entire document on every keystroke. Prefer narrowly scoped input rules or post-transaction transformations. Avoid interfering with IME composition and paste operations.

## 6. Initial rule inventory

The exact legacy behavior must be reviewed against the old Genowrite repositories during implementation. This document defines intended behavior, not every edge case.

### Automatic transformations (configurable)

- Normalize straight apostrophe to typographic apostrophe where linguistically safe.
- Normalize three periods to ellipsis character where appropriate.
- Normalize repeated hyphens to the configured dash character only in recognized contexts.
- Collapse repeated spaces to one space, except intentional indentation or code-like content if later supported.
- Capitalize sentence starts only when context is unambiguous.
- Handle common Italian forms such as `E'` → `È` only when safe and not part of a larger token.

### Diagnostics

- Suspicious consecutive uppercase letters, with acronym/initialism exceptions.
- Space before punctuation.
- Missing punctuation at likely paragraph/sentence endings.
- Leading/trailing whitespace.
- Repeated punctuation or suspicious spacing.

### Rules that need particular care

- “Two uppercase letters in a row” must not blindly rewrite acronyms, initials, abbreviations or intentional capitalization. Prefer a diagnostic with configurable exceptions.
- Capitalization after newline is not always correct (dialogue, lists, continuation lines); provide context-sensitive behavior or make it configurable.
- Dash normalization must distinguish hyphen, en dash and em dash and must be configurable.
- Apostrophe replacement must not damage URLs, code-like text, contractions in other languages or intentional literal characters.

## 7. Diagnostics UI

- Show issue count in a compact indicator.
- Provide a panel/list of diagnostics for the active document.
- Selecting a diagnostic navigates to its range in the editor.
- Diagnostics do not alter text unless the user explicitly invokes a correction.
- Support ignore/dismiss where sensible.
- Never use color alone to convey issue severity.

## 8. Undo/redo and cursor safety

- Automatic transformations must be represented as editor transactions that integrate with undo history.
- Cursor and selection must remain logically positioned after a transformation.
- A user must be able to undo an automatic correction.
- Test transformations at beginning, middle and end of document, with selections, paste, newline and IME composition.

## 9. Testing

Create table-driven tests for every rule, including:

- expected transformation;
- no-op cases;
- exception cases;
- Unicode and Italian punctuation;
- cursor mapping where applicable;
- undo/redo behavior in editor integration tests.
