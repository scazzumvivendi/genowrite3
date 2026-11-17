import { t } from '../../i18n';
import type { WritingStatus } from './model';

export const writingStatusLabels: Record<WritingStatus, string> = {
  planned: t('pianificato_0b4528'),
  in_progress: t('in_lavorazione_3de8fa'),
  first_draft: t('prima_stesura_f11180'),
  revised: t('revisionato_a6dde2'),
  final: t('definitivo_7daf03'),
};
