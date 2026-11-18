# AGENTS.md — Instructions for coding agents

## Mission

Implement **Genowrite 3**, a local-first writing application for long-form documents, books, novels, stories, essays and manuals.

Genowrite 3 starts from a clean codebase. Genowrite and Genowrite 2 repositories are historical references only. Do not import, migrate, or preserve legacy data formats unless a future task explicitly requests it.

## Mandatory working rules

1. Read this file and all documents in `specs/` before implementation.
2. Work incrementally according to `specs/ROADMAP.md`. Do not implement the entire product in one giant change.
3. Before adding a dependency, verify that it is maintained, compatible with the chosen React/Vite/TypeScript versions, usable offline, and appropriately licensed.
4. No backend, hosted database, account, authentication, remote API, cloud sync, telemetry, or required third-party runtime service.
5. Do not load essential JavaScript, CSS, fonts, icons, or editor assets from a CDN. Bundle dependencies locally.
6. Never silently discard user content. Destructive operations require confirmation and, where appropriate, undo/recovery.
7. Keep domain logic separate from UI components. Keep the typography rules engine independent from the editor implementation.
8. All persisted entities must have stable IDs. Do not use titles or array positions as identity.
9. Add automated tests for domain logic, persistence, text transformations, statistics and export serialization.
10. Keep the app usable with keyboard and screen readers. Use semantic controls, visible focus, and accessible labels.
11. Do not invent behavior where the specification is explicit. Where it is silent, choose the simplest behavior consistent with the product philosophy and document the decision.
12. Do not claim a feature is complete unless its acceptance tests pass.
13. Keep `README.md`, technical notes and tests updated as implementation evolves.
14. Avoid oversized files and monolithic components. Prefer small modules with clear responsibilities.

## Product invariants

- The primary activity is writing. The editor must remain visually central and uncluttered.
- The writing experience should remain close to Genowrite 2, while the application architecture and UI are rebuilt.
- Use a Material Design 3 visual language.
- The bottom-left writing statistics area is always visible in the main writing workspace. Do not add a hide toggle.
- Display current document (chapter or scene) statistics and whole-project statistics simultaneously.
- Chapters and scenes are independent content documents. Scenes are optional; a chapter can contain direct text or an ordered list of scenes.
- A chapter must not count both its direct text and its scenes as manuscript content at the same time.
- Notes, synopsis, research entries, character/location/object profiles are excluded from manuscript export and manuscript word counts unless explicitly included by a future feature.
- All user content and settings are stored locally in the browser.
- Export formats for the first release: DOCX and TXT. Full-project JSON backup/restore is mandatory.
- Offline use is a core requirement after the app has been installed/loaded and its assets cached.

## Proposed stack (validate in Phase 0)

- TypeScript
- React
- Vite
- Material Design 3-aligned component system and design tokens
- TipTap / ProseMirror for rich-text editing
- IndexedDB through Dexie
- Zustand for transient application state
- `docx` package for DOCX generation
- Vitest for unit/integration tests
- Playwright for end-to-end tests
- Vite PWA tooling / service worker for offline shell

The exact UI component library is not locked. Material UI's visual system is not automatically identical to Material Design 3; validate the chosen components and theme against M3 guidance. Prefer a consistent, locally bundled implementation over mixing several design systems.

## Required first action

Before coding, produce a short Phase 0 report containing:

- proposed dependency versions and license notes;
- editor prototype findings;
- confirmation that the UI approach can meet Material Design 3 requirements;
- offline/PWA approach;
- known risks and mitigations.

Then implement only Phase 1 from `specs/ROADMAP.md`.

## Definition of done for each phase

- TypeScript build succeeds with strict checking.
- Linting and formatting checks pass.
- Relevant unit and integration tests pass.
- No console errors in the supported browser test.
- No essential network requests at runtime.
- Documentation reflects actual behavior.
- Changes are summarized, with files changed, tests run, known limitations and next phase.

## Browser support

Target modern evergreen desktop browsers first: current Chrome, Edge and Firefox, plus current Safari where practical. Responsive layouts should remain usable on tablet and mobile, but desktop writing is the primary use case. Do not promise support for obsolete browsers.

## Non-goals for v1.0

- User accounts or collaboration.
- Cloud synchronization.
- AI text generation or AI-assisted rewriting.
- Automatic grammar/spell checking via remote services.
- Import from Genowrite 1 or Genowrite 2.
- Full desktop word-processing layout and page-layout editing.
- Automatic entity extraction from manuscript text.
- Complex worldbuilding databases.

## Estensione autorizzata successiva

Le richieste dell’utente di novembre 2026 autorizzano Dropbox opzionale con backup,
OAuth PKCE persistente, sincronizzazione e tentativo di merge, senza backend o
account Genowrite. Sovrascrivono i precedenti non-goal su cloud sync e API remote
per questa sola integrazione. Locale e offline rimangono indipendenti.
Requisiti aggiornati e lavoro incrementale in `specs/REFINEMENTS.md`.
