import { t } from '../../i18n';
import {
  projectService,
  type ProjectService,
} from '../storage/project-service';

export function duplicateNode(
  projectId: string,
  id: string,
  service: ProjectService = projectService,
) {
  return service.mutate(projectId, (snapshot) => {
    const root = snapshot.nodes.find(
      (node) => node.id === id && !node.deletedAt,
    );
    if (!root || !['chapter', 'scene'].includes(root.type)) {
      throw new Error(t('si_possono_duplicare_capitoli_o_scene_61cd59'));
    }
    const originals = [
      root,
      ...snapshot.nodes.filter(
        (node) => node.parentId === id && !node.deletedAt,
      ),
    ];
    const ids = new Map(
      originals.map((node) => [node.id, crypto.randomUUID()]),
    );
    const now = new Date().toISOString();
    const rootOrder =
      Math.max(
        ...snapshot.nodes
          .filter((node) => node.parentId === root.parentId)
          .map((node) => node.order),
      ) + 1;
    for (const original of originals) {
      const copy = {
        ...original,
        id: ids.get(original.id)!,
        parentId: ids.get(original.parentId ?? '') ?? original.parentId,
        order: original.id === id ? rootOrder : original.order,
        createdAt: now,
        updatedAt: now,
      };
      if (original.id === id) {
        copy.title = t('value0_copia_3e037f', { value0: original.title });
      }
      if (original.documentId) {
        const document = snapshot.documents.find(
          (item) => item.id === original.documentId,
        )!;
        copy.documentId = crypto.randomUUID();
        snapshot.documents.push({
          ...structuredClone(document),
          id: copy.documentId,
          ownerNodeId: copy.id,
          revision: 0,
          updatedAt: now,
        });
      }
      snapshot.nodes.push(copy);
    }
    return ids.get(id)!;
  });
}
