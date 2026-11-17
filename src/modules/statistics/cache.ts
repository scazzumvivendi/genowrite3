import { db, type GenowriteDatabase } from '../../database/db';
import { countContent } from './counts';

export async function rebuildStatistics(
  projectId: string,
  database: GenowriteDatabase = db,
) {
  await database.transaction(
    'rw',
    [database.documents, database.statistics],
    async () => {
      const documents = await database.documents
        .where('projectId')
        .equals(projectId)
        .toArray();
      await database.statistics.where('projectId').equals(projectId).delete();
      await database.statistics.bulkPut(
        documents.map((document) => ({
          id: document.id,
          projectId,
          revision: document.revision,
          ...countContent(document.content),
        })),
      );
    },
  );
}
