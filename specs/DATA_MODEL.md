# Domain and persistence model

This is a conceptual model. The implementation may refine field names, but must preserve the semantics and invariants.

## 1. ID and timestamps

- Every entity has a stable UUID (or equivalent collision-resistant ID).
- IDs never derive from titles or tree positions.
- Store timestamps as ISO-8601 UTC strings or numeric epoch values consistently.
- Use explicit schema versioning for backup format and IndexedDB.

## 2. Project

```ts
type Project = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
  rootOrder: string[];
};
```

Project owns or references manuscript nodes and reference-library entities.

## 3. Manuscript node

```ts
type NodeType = 'volume' | 'part' | 'chapter' | 'scene' | 'folder';

type ManuscriptNode = {
  id: string;
  projectId: string;
  parentId: string | null;
  type: NodeType;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  synopsis?: string;
  status?: 'planned' | 'in_progress' | 'first_draft' | 'revised' | 'final';
  targetWordCount?: number;
  deletedAt?: string;
};
```

A folder is organizational only and must not contain manuscript text. The parent-child matrix is defined in PRODUCT_SPEC.md.

## 4. Chapter mode

```ts
type ChapterMode = 'direct' | 'scenes';

type ChapterData = {
  chapterId: string;
  mode: ChapterMode;
  directDocumentId?: string; // required in direct mode
};
```

In `direct` mode, the chapter owns exactly one manuscript document and has no scene children.

In `scenes` mode, the chapter has ordered scene children and no direct manuscript document.

Enforce this invariant in domain services and database transactions, not only in UI.

## 5. Document

```ts
type ManuscriptDocument = {
  id: string;
  projectId: string;
  ownerNodeId: string;
  contentFormat: 'tiptap-json';
  content: unknown; // validate against supported ProseMirror schema
  plainTextCache?: string;
  wordCount: number;
  characterCount: number;
  updatedAt: string;
  revision: number;
};
```

Document content is TipTap/ProseMirror JSON, not arbitrary HTML. `plainTextCache` and counts are derived caches and must be rebuildable.

Exactly one manuscript document belongs to each direct-mode chapter or each scene. No manuscript document belongs to volumes, parts or folders.

## 6. Reference library

```ts
type ReferenceKind = 'character' | 'location' | 'object';

type ReferenceRecord = {
  id: string;
  projectId: string;
  kind: ReferenceKind;
  name: string;
  description?: string;
  notes?: string;
  fields?: Record<string, string | string[]>;
  createdAt: string;
  updatedAt: string;
};
```

Keep optional type-specific data flexible but validated. Avoid arbitrary executable or HTML fields.

## 7. Notes and research

```ts
type Note = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  kind: 'project_note' | 'research' | 'synopsis';
  linkedNodeIds: string[];
  linkedReferenceIds: string[];
  createdAt: string;
  updatedAt: string;
};
```

A node may also have a synopsis field. Avoid duplicate sources of truth; decide whether synopsis is stored on the node or as a Note, not both without a clear relationship.

## 8. Relations

```ts
type EntityRelation = {
  id: string;
  projectId: string;
  sourceType: 'node' | 'reference' | 'note';
  sourceId: string;
  targetType: 'node' | 'reference' | 'note';
  targetId: string;
  relationType: 'mentions' | 'appears_in' | 'related_to' | 'custom';
};
```

For v1, links can be simple associations. Do not claim automatic manuscript mention detection.

## 9. Settings

Application preferences and project-specific settings must be stored separately.

Examples:

- Theme: light/dark/system.
- Editor font, size, line height and text width.
- Typography rule configuration.
- Reading speed.
- Autosave debounce.
- Default export profile.

## 10. Writing sessions (later release)

Plan a compatible model for session start/end, starting/ending word count and word delta. Do not block v1.0 on session analytics.

## 11. Database indexes

At minimum, index:

- project ID;
- node ID, project ID, parent ID, type and order;
- document ID, owner node ID and project ID;
- reference ID, project ID and kind;
- note ID and project ID;
- relation source/target IDs and project ID.

Exact Dexie schema to be specified in implementation and tested.

## 12. Core invariants

1. No duplicate IDs.
2. Every node belongs to an existing project.
3. Parent nodes belong to the same project.
4. Parent-child type combinations are valid.
5. No cycles in the hierarchy.
6. Every direct chapter has exactly one direct document and no scenes.
7. Every scene-mode chapter has no direct document; scenes own their own documents.
8. Every scene belongs to exactly one chapter.
9. Project word totals count each manuscript document once.
10. Notes/reference entities are excluded from manuscript totals.
11. Moving nodes preserves IDs and document content.
12. Deleting a project must not orphan records.
