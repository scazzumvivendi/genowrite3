import type { WritingStatus } from './model';

export const writingStatusLabels: Record<WritingStatus, string> = {
  planned: 'Pianificato',
  in_progress: 'In lavorazione',
  first_draft: 'Prima stesura',
  revised: 'Revisionato',
  final: 'Definitivo',
};
