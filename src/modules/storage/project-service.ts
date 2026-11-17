import { t } from '../../i18n';
import { countContent } from '../statistics/counts';
import type { JSONContent } from '@tiptap/core';
import { db, readProject, type GenowriteDatabase } from '../../database/db';
import {
  emptyContent,
  type ManuscriptNode,
  type NodeType,
  type Project,
  type ProjectSnapshot,
} from '../manuscript/model';
import {
  assertParent,
  requireTitle,
  validateContent,
  validateSnapshot,
} from '../manuscript/validation';

export class ProjectService {
  constructor(public database: GenowriteDatabase = db) {}
  async createProject(title: string) {
    requireTitle(title);
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      title: title.trim(),
      author: '',
      description: '',
      genre: '',
      createdAt: now,
      updatedAt: now,
    };
    await this.database.projects.add(project);
    return project.id;
  }
  async mutate<T>(
    projectId: string,
    operation: (snapshot: ProjectSnapshot) => T,
  ) {
    return this.database.transaction(
      'rw',
      this.database.projectTables,
      async () => {
        const snapshot = await readProject(this.database, projectId);
        if (snapshot.project.deletedAt) {
          throw new Error(
            t('ripristina_il_progetto_dal_cestino_prima_di_modificarlo_236269'),
          );
        }
        const previousRelations = snapshot.relations.map(
          (relation) => relation.id,
        );
        const result = operation(snapshot);
        validateSnapshot(snapshot);
        snapshot.project.updatedAt = new Date().toISOString();
        await this.database.projects.put(snapshot.project);
        await this.database.nodes.bulkPut(snapshot.nodes);
        await this.database.documents.bulkPut(snapshot.documents);
        await this.database.references.bulkPut(snapshot.references);
        await this.database.notes.bulkPut(snapshot.notes);
        await this.database.relations.bulkDelete(
          previousRelations.filter(
            (id) => !snapshot.relations.some((relation) => relation.id === id),
          ),
        );
        await this.database.relations.bulkPut(snapshot.relations);
        await this.database.projectSettings.put({
          projectId,
          values: snapshot.settings,
        });
        return result;
      },
    );
  }
  async updateProject(
    projectId: string,
    values: Pick<Project, 'title' | 'author' | 'description' | 'genre'>,
  ) {
    return this.mutate(projectId, (snapshot) => {
      Object.assign(snapshot.project, values);
    });
  }
  async setProjectDeleted(projectId: string, deleted: boolean) {
    await this.database.transaction('rw', this.database.projects, async () => {
      const project = await this.database.projects.get(projectId);
      if (!project) {
        throw new Error(t('progetto_non_trovato_05065b'));
      }
      if (deleted) {
        project.deletedAt = new Date().toISOString();
      } else {
        delete project.deletedAt;
      }
      await this.database.projects.put(project);
    });
  }
  addNode(
    projectId: string,
    parentId: string | null,
    type: NodeType,
    title: string,
    mode: 'direct' | 'scenes' = 'direct',
  ) {
    return this.mutate(projectId, (snapshot) => {
      assertParent(snapshot.nodes, type, parentId);
      requireTitle(title);
      const now = new Date().toISOString();
      const node: ManuscriptNode = {
        id: crypto.randomUUID(),
        projectId,
        parentId,
        type,
        title: title.trim(),
        order:
          Math.max(
            -1,
            ...snapshot.nodes
              .filter((n) => n.parentId === parentId)
              .map((n) => n.order),
          ) + 1,
        synopsis: '',
        status: 'planned',
        createdAt: now,
        updatedAt: now,
      };
      if (type === 'chapter') {
        node.mode = mode;
      }
      if (type === 'scene' || (type === 'chapter' && mode === 'direct')) {
        node.documentId = crypto.randomUUID();
        snapshot.documents.push({
          id: node.documentId,
          projectId,
          ownerNodeId: node.id,
          contentFormat: 'tiptap-json',
          content: emptyContent(),
          revision: 0,
          updatedAt: now,
        });
      }
      snapshot.nodes.push(node);
      return node.id;
    });
  }
  updateNode(
    projectId: string,
    id: string,
    values: Partial<Pick<ManuscriptNode, 'title' | 'synopsis' | 'status'>>,
  ) {
    return this.mutate(projectId, (snapshot) => {
      const node = snapshot.nodes.find((n) => n.id === id && !n.deletedAt);
      if (!node) {
        throw new Error(t('elemento_non_trovato_bee2a6'));
      }
      Object.assign(node, values, { updatedAt: new Date().toISOString() });
    });
  }
  moveNode(
    projectId: string,
    id: string,
    parentId: string | null,
    index: number,
  ) {
    return this.mutate(projectId, (snapshot) => {
      const node = snapshot.nodes.find((n) => n.id === id && !n.deletedAt);
      if (!node) {
        throw new Error(t('elemento_non_trovato_bee2a6'));
      }
      assertParent(snapshot.nodes, node.type, parentId, id);
      const siblings = snapshot.nodes
        .filter((n) => n.parentId === parentId && !n.deletedAt && n.id !== id)
        .sort((a, b) => a.order - b.order);
      siblings.splice(Math.max(0, Math.min(index, siblings.length)), 0, node);
      node.parentId = parentId;
      siblings.forEach((n, order) => {
        n.order = order;
      });
    });
  }
  convertToScenes(projectId: string, id: string) {
    return this.mutate(projectId, (snapshot) => {
      const chapter = snapshot.nodes.find((n) => n.id === id && !n.deletedAt);
      if (chapter?.type !== 'chapter' || chapter.mode !== 'direct') {
        throw new Error(t('seleziona_un_capitolo_diretto_722b8b'));
      }
      const document = snapshot.documents.find(
        (doc) => doc.id === chapter.documentId,
      )!;
      const scene: ManuscriptNode = {
        id: crypto.randomUUID(),
        projectId,
        parentId: id,
        type: 'scene',
        title: t('scena_1_610894'),
        order: 0,
        synopsis: '',
        status: chapter.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        documentId: document.id,
      };
      document.ownerNodeId = scene.id;
      chapter.mode = 'scenes';
      delete chapter.documentId;
      snapshot.nodes.push(scene);
      return { sceneId: scene.id, revision: document.revision };
    });
  }
  async undoConversion(
    projectId: string,
    id: string,
    sceneId: string,
    revision: number,
  ) {
    await this.database.transaction(
      'rw',
      this.database.projectTables,
      async () => {
        const snapshot = await readProject(this.database, projectId);
        const chapter = snapshot.nodes.find((n) => n.id === id);
        const scene = snapshot.nodes.find((n) => n.id === sceneId);
        const document = snapshot.documents.find(
          (d) => d.ownerNodeId === sceneId,
        );
        if (
          !chapter ||
          chapter.mode !== 'scenes' ||
          !scene ||
          !document ||
          document.revision !== revision ||
          snapshot.nodes.filter((n) => n.parentId === id).length !== 1
        ) {
          throw new Error(
            t(
              'il_capitolo_e_cambiato_annullamento_non_sicuro_il_testo_e_conserv_756425',
            ),
          );
        }
        chapter.mode = 'direct';
        chapter.documentId = document.id;
        document.ownerNodeId = id;
        snapshot.nodes = snapshot.nodes.filter((n) => n.id !== sceneId);
        validateSnapshot(snapshot);
        await this.database.nodes.delete(sceneId);
        await this.database.nodes.put(chapter);
        await this.database.documents.put(document);
      },
    );
  }
  setNodeDeleted(projectId: string, id: string, deleted: boolean) {
    return this.mutate(projectId, (snapshot) => {
      const root = snapshot.nodes.find((n) => n.id === id);
      if (!root) {
        throw new Error(t('elemento_non_trovato_bee2a6'));
      }
      const oldTimestamp = root.deletedAt;
      const stamp = new Date().toISOString();
      const ids = new Set([id]);
      for (let changed = true; changed;) {
        changed = false;
        for (const node of snapshot.nodes) {
          if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
            ids.add(node.id);
            changed = true;
          }
        }
      }
      for (const node of snapshot.nodes.filter((n) => ids.has(n.id))) {
        if (deleted && !node.deletedAt) {
          node.deletedAt = stamp;
        }
        if (!deleted && node.deletedAt === oldTimestamp) {
          delete node.deletedAt;
        }
      }
    });
  }
  async saveDocument(
    id: string,
    content: JSONContent,
    expectedRevision: number,
  ) {
    validateContent(content);
    return this.database.transaction(
      'rw',
      [this.database.documents, this.database.statistics],
      async () => {
        const document = await this.database.documents.get(id);
        if (!document) {
          throw new Error(t('documento_non_trovato_daca01'));
        }
        if (document.revision !== expectedRevision) {
          throw new Error(
            t(
              'il_documento_e_cambiato_in_un_altra_scheda_le_modifiche_non_salva_182ed9',
            ),
          );
        }
        document.content = content;
        document.revision++;
        document.updatedAt = new Date().toISOString();
        await this.database.documents.put(document);
        await this.database.statistics.put({
          id: document.id,
          projectId: document.projectId,
          revision: document.revision,
          ...countContent(document.content),
        });
        return document.revision;
      },
    );
  }
}
export const projectService = new ProjectService();
