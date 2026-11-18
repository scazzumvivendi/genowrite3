import { t } from '../../i18n';
import { childrenOf, type ProjectSnapshot } from './model';

/** Preserve old containers as library notes and flatten chapter order, including trash. */
export function simplifyManuscript(snapshot: ProjectSnapshot) {
  const old = snapshot.nodes;
  const containers = old.filter(
    (node) => !['chapter', 'scene'].includes(node.type),
  );
  const containerIds = new Set(containers.map((node) => node.id));
  const descendants = (id: string): string[] =>
    childrenOf(old, id).flatMap((child) =>
      child.type === 'chapter' ? [child.id] : descendants(child.id),
    );
  const chapterLinks = new Map(
    containers.map((node) => [node.id, descendants(node.id)]),
  );
  for (const node of containers) {
    snapshot.notes.push({
      id: node.id,
      projectId: node.projectId,
      title: node.title,
      body: `${node.synopsis}\n\n${t('migration.container')}\n${JSON.stringify(node, null, 2)}`,
      kind: 'project_note',
      linkedNodeIds: chapterLinks.get(node.id)!,
      linkedReferenceIds: [],
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
      ...(node.deletedAt ? { deletedAt: node.deletedAt } : {}),
    });
  }
  const ordered = (id: string | null): typeof old =>
    childrenOf(old, id).flatMap((node) =>
      node.type === 'chapter'
        ? [node]
        : node.type === 'scene'
          ? []
          : ordered(node.id),
    );
  if (containers.length) {
    ordered(null).forEach((node, order) => {
      let parent = old.find((item) => item.id === node.parentId);
      while (parent) {
        if (!node.deletedAt && parent.deletedAt) {
          node.deletedAt = parent.deletedAt;
        }
        parent = old.find((item) => item.id === parent?.parentId);
      }
      if (!node.deletedAt) {
        delete node.deletedAt;
      }
      node.parentId = null;
      node.order = order;
    });
  }
  for (const relation of snapshot.relations) {
    if (relation.sourceType === 'node' && containerIds.has(relation.sourceId)) {
      relation.sourceType = 'note';
    }
    if (relation.targetType === 'node' && containerIds.has(relation.targetId)) {
      relation.targetType = 'note';
    }
  }
  for (const note of snapshot.notes) {
    note.linkedNodeIds = [
      ...new Set(
        note.linkedNodeIds.flatMap((id) =>
          containerIds.has(id) ? chapterLinks.get(id)! : [id],
        ),
      ),
    ];
  }
  snapshot.nodes = old.filter((node) => !containerIds.has(node.id));
  for (const node of snapshot.nodes) {
    delete (node as unknown as Record<string, unknown>).status;
  }
  return snapshot;
}
