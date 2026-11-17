# Technical architecture

## 1. Proposed stack

Validate versions and compatibility during Phase 0; pin dependencies after prototype.

- TypeScript with strict mode
- React
- Vite
- Material Design 3-aligned UI implementation and design tokens
- TipTap / ProseMirror editor
- IndexedDB via Dexie
- Zustand for transient UI state
- `docx` for DOCX generation
- Vitest for unit/integration tests
- Playwright for end-to-end tests
- Vite PWA tooling and service worker

Do not assume that a component library named “Material UI” implements Material Design 3 exactly. Verify its design language. Choose one coherent component strategy and avoid mixing unrelated systems.

## 2. Architectural boundaries

Use feature modules with explicit boundaries:

- `projects`: project lifecycle and metadata
- `manuscript`: hierarchy, nodes, chapter/scene behavior
- `editor`: TipTap integration and document serialization
- `rules`: typography transformations and diagnostics
- `statistics`: word/character counts and reading time
- `library`: characters, locations and objects
- `notes`: notes, synopsis and research
- `storage`: Dexie schema, repositories and migrations
- `export`: DOCX/TXT serialization
- `backup`: project JSON export/import
- `settings`: app and project preferences
- `app`: routing, shell, theme and composition

Domain logic must not import React components. UI components should call application services/use cases rather than writing directly to IndexedDB.

## 3. Suggested source layout

```text
src/
  app/
    App.tsx
    routes/
    theme/
  components/
    layout/
    navigation/
    statistics/
    dialogs/
    common/
  modules/
    projects/
    manuscript/
    editor/
    rules/
    statistics/
    library/
    notes/
    export/
    backup/
    settings/
  database/
    db.ts
    migrations/
    repositories/
  stores/
  hooks/
  types/
  utils/
  test/
```

Adjust as needed, but preserve separation of concerns.

## 4. State management

Use Zustand only for transient UI/application state, such as:

- active project ID;
- active node/document ID;
- expanded tree node IDs;
- sidebar/inspector visibility;
- active view mode;
- unsaved/processing indicators;
- dialog state.

Persisted domain data belongs in IndexedDB, not duplicated as a second source of truth in Zustand.

Use repository/service functions for CRUD and domain operations. Subscribe to database queries for reactive UI updates.

## 5. Persistence

Dexie/IndexedDB is the primary durable store. Design repositories around entities and transactions.

Requirements:

- Schema versioning and migrations.
- Atomic operations for structural conversions and moves.
- Debounced editor persistence.
- Flush pending writes before document navigation when possible.
- Handle quota errors and transaction failures visibly.
- Do not assume browser storage is permanent; explain backup in onboarding/settings.
- Request persistent storage permission only if appropriate and supported; do not make it a hard requirement.
- Store document JSON in the editor's native structured format.
- Never store executable code in project data.

## 6. Offline/PWA

- Bundle all runtime dependencies, fonts and icons locally.
- Cache the application shell and static assets.
- No runtime dependency on a remote font, icon or API.
- Use a service worker with a clear update strategy.
- Ensure updates do not silently discard unsaved edits.
- App must launch and edit existing local projects offline after initial install/cache.
- IndexedDB is the content store; service worker cache is only for application assets.

## 7. Performance

Long documents are a known risk. Do not render every chapter/scene editor simultaneously.

- Mount only the active editor document.
- Lazy-load nonessential screens/modules where useful.
- Avoid recalculating the entire project word count on every keystroke.
- Update active document statistics incrementally or via debounced computation.
- Recompute project totals when a document save completes, a node is moved/deleted, or content changes; use cached per-document statistics with integrity checks.
- Keep derived counts rebuildable from source documents.
- Consider a Web Worker for expensive full-project indexing/counting only if profiling demonstrates a need.
- Avoid unnecessary rerenders of the editor on statistics changes.
- Test with at least 100,000 words across multiple documents and with a single large document.

## 8. Security and privacy

- No network transmission of manuscript content.
- No telemetry or analytics by default.
- Sanitize/validate imported JSON and rich-text structures.
- Do not render arbitrary HTML from imported project data.
- Validate export content and filenames.
- No secrets or credentials are required by the app.

## 9. Quality gates

- TypeScript strict mode.
- ESLint and formatter.
- Unit tests for domain logic.
- Integration tests for repositories and migrations.
- E2E tests for core writing flows.
- Accessibility checks for major interactions.
- Offline test with network disabled after install.
- No essential CDN requests.
