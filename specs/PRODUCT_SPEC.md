# Product specification

## 1. Product summary

Genowrite 3 is a local-first writing workspace for long-form writing. It combines a distraction-light rich-text editor with hierarchical manuscript organization, typography automation, live writing statistics, project reference material and document export.

The product must feel familiar to a Genowrite 2 user while providing a substantially stronger project model.

## 2. Target users and use cases

Primary use cases:

- Write a novel, short story, book, essay, manual or other long document.
- Organize a manuscript into optional volumes, parts, chapters and scenes.
- Write directly inside a chapter without creating scenes.
- Split a chapter's existing direct text into scenes without losing content.
- Maintain separate reference material: characters, places, objects, notes and research.
- Monitor chapter and project word counts while writing.
- Export a manuscript to DOCX or TXT.
- Back up and restore a complete project without a server.

## 3. Product principles

1. Writing is the primary activity; organization must not overwhelm the editor.
2. The editor should remain similar in spirit to Genowrite 2: central writing surface, simple toolbar, comfortable text width and minimal distraction.
3. Material Design 3 visual language: coherent color roles, typography scale, shape, spacing, elevation, states and accessible interaction.
4. Local-first and offline-capable. User content stays on the device unless the user explicitly exports it.
5. No feature may risk silent content loss.
6. Optional structure: users must not be forced to create volumes, parts or scenes.

## 4. Main application layout

Desktop writing workspace:

- Top app bar: application/project context, current item title, save state, undo/redo where appropriate, settings and export entry point.
- Left sidebar: project navigation tree and project library.
- Center: active editor document.
- Optional right inspector: selected document metadata, synopsis/notes, links to reference entities and detailed statistics.
- Bottom-left persistent statistics area: always visible in the main writing workspace.

The left sidebar must be collapsible. The editor must retain the largest share of available horizontal space. The right inspector may be closed. The statistics area must not have a hide control.

### Responsive behavior

Desktop is the primary target. On narrow screens:

- navigation and inspector may become drawers;
- editor remains the primary view;
- statistics remain accessible and visible in a compact form;
- controls must not overlap the editor or each other.

## 5. Navigation and project structure

A project may contain:

- Volumes (optional grouping nodes)
- Parts (optional grouping nodes)
- Chapters (manuscript content nodes)
- Scenes (manuscript content nodes nested under a chapter)
- Folders (organizational nodes, not manuscript content)
- Project-level reference areas: characters, locations, objects, notes/research

Users can create chapters directly at project root or under a volume/part. The precise allowed parent-child matrix must be encoded centrally and tested. Initial intended hierarchy:

- Project → Volume, Part, Chapter, Folder
- Volume → Part, Chapter, Folder
- Part → Chapter, Folder
- Chapter → Scene
- Scene → no child nodes

Do not allow nested scenes in v1.0.

### Chapter content modes

A chapter has exactly one active manuscript mode:

- `direct`: the chapter owns one rich-text document.
- `scenes`: the chapter's manuscript content is the ordered concatenation of its child scenes.

A chapter can have zero scenes in `scenes` mode (empty chapter). A chapter in `direct` mode cannot simultaneously contribute direct text and scene text to manuscript output.

### Convert direct chapter to scenes

Provide an explicit action to convert a direct-text chapter into scene mode:

- Preserve the entire rich-text content.
- Create one scene using the chapter title plus a suitable default suffix or a neutral title such as “Scene 1”.
- Move/copy the document content into the new scene atomically.
- Only after successful persistence, switch the chapter to `scenes` mode and clear the chapter's direct document reference.
- The operation must be undoable or recoverable; never leave the chapter empty if conversion fails.
- Ask for confirmation before conversion.

The reverse operation (combine scenes into direct chapter text) is not required for v1.0 unless implemented safely with a preview and no data loss.

## 6. Tree interactions

Required:

- Expand/collapse nodes.
- Select a chapter or scene to open it in the editor.
- Create, rename and delete supported nodes.
- Reorder nodes by drag and drop.
- Move a scene between chapters.
- Move chapters between compatible containers.
- Duplicate a chapter or scene.
- Show item word count in the tree where useful.
- Context menu for common actions.
- Confirmation for destructive deletion.
- Empty states with clear create actions.

Drag-and-drop must enforce the hierarchy rules. Invalid drops must be rejected with visible feedback. Moving a node must preserve its ID and content.

Deletion should use a recoverable soft-delete/trash strategy in v1.0 if practical; otherwise require confirmation and ensure an immediately available undo path.

## 7. Project reference library

Each project has separate reference collections:

- Characters
- Locations
- Objects
- Notes and research

Each record supports:

- Stable ID
- Name/title
- Description
- Free-form notes
- Created/updated timestamps
- Optional links to chapters/scenes

Characters may include optional fields such as role, traits and aliases. Locations may include optional type and setting details. Objects may include optional category and characteristics. Avoid rigid schemas that make the app feel like a worldbuilding database.

Reference records are not manuscript content and are excluded from DOCX/TXT manuscript exports by default.

Global search should eventually search manuscript text and reference records. Basic project search is desirable in v1.0; advanced search is later.

## 8. Writing editor

Required:

- Rich text editing with paragraphs, bold, italic, underline, ordered/unordered lists and basic headings if needed.
- Undo/redo.
- Keyboard shortcuts.
- Find and replace in the current document.
- Document title separate from document body.
- Comfortable readable column width.
- Configurable editor font family, font size and line height; display preferences must not alter exported formatting unless the user selects matching export settings.
- Autosave with visible state.
- Typography rules engine.
- Correct cursor and selection preservation after transformations.
- No accidental content loss during switching documents, navigating or closing the app.

The editor should not attempt to reproduce Microsoft Word's page layout UI.

## 9. Persistent writing statistics

The statistics area is a product invariant:

- Fixed at the bottom-left of the main writing workspace.
- Always visible; no hide toggle.
- Displays current active manuscript document statistics and whole-project statistics simultaneously.
- Current document means the active chapter (direct mode) or active scene.
- Project totals count each manuscript document exactly once.
- For a chapter in scene mode, chapter totals are the sum of its scenes.
- Project totals exclude notes, synopsis, reference profiles and folders.
- Display word count and character count. Estimated reading time is also displayed.
- Updates while typing, without blocking editor input.
- Use a consistent word-count definition and document it.
- Character count definition must be explicit (recommended: Unicode code points, with spaces included; expose this consistently).
- Reading-time estimate must use a configurable or documented default words-per-minute value (recommended default 200 wpm, rounded up to the next minute).

Additional statistics for later release:

- session word delta;
- daily goals;
- writing streak/productivity charts;
- per-chapter targets.

Do not show fabricated example counts in production. Empty project values should be zero.

## 10. Typography rules

See `EDITOR_AND_RULES.md`. Rules must be configurable, tested, reversible and independent of UI.

## 11. Export

See `EXPORT_AND_BACKUP.md`.

## 12. Settings

Application-level settings:

- Light/dark/system theme.
- Editor font family, size, line height and text width.
- Default export profile.
- Typography rules enabled/disabled and rule options.
- Reading speed.
- Autosave delay (within safe bounds).
- Optional confirmation preferences where safe.

Project-level metadata:

- Title
- Author
- Description
- Genre (optional)
- Created/updated timestamps

## 13. Future features, not v1.0 blockers

- Corkboard/bacheca scene view.
- Advanced writing goals and productivity analytics.
- Version history and document comparison.
- Advanced global search.
- Custom export templates.
- More elaborate worldbuilding fields.
- Scene status workflow and planning metadata.

## Estensione autorizzata: Dropbox (novembre 2026)

Il vincolo originale che esclude API remote e trasmissione di contenuti ammette
ora importazione ed esportazione **opzionali ed esplicite** di backup JSON su
Dropbox. Nessuna sincronizzazione automatica, account Genowrite o backend.
L’archivio locale e l’uso offline rimangono indipendenti da Dropbox. Ogni upload
crea una copia distinta; il download passa dalla validazione e dall’anteprima,
poi dalla conferma di ripristino come nuovo progetto. Token brevi nella sessione
della scheda, OAuth PKCE senza secret. Dettagli in `docs/DROPBOX.md`.
