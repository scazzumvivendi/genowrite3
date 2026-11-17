import { t } from '../i18n';
import { useEffect, useState } from 'react';
import { useLocalQuery } from './useLocalQuery';
import {
  automaticBackupTick,
  readAutomatic,
} from '../modules/dropbox/automatic';
import type { DraftSaver } from '../modules/storage/draft-saver';

export function useDropboxAutomatic(projectId: string, saver: DraftSaver) {
  const [error, setError] = useState('');
  const query = useLocalQuery(() => readAutomatic(projectId), [projectId]);
  useEffect(() => {
    if (!query.value?.enabled) {
      return;
    }
    let stopped = false;
    async function tick() {
      if (stopped) {
        return;
      }
      // Le schede nascoste non inviano: evita backup da bozze non attive.
      if (document.visibilityState !== 'visible') {
        return;
      }
      try {
        await automaticBackupTick(projectId, () => saver.flush());
        setError('');
      } catch (reason) {
        setError(
          t('backup_dropbox_non_disponibile_value0_64394b', {
            value0: String(reason),
          }),
        );
      }
    }
    const timer = window.setInterval(() => {
      void tick();
    }, 60_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [projectId, saver, query.value?.enabled]);
  return { ...query, error: error || query.error };
}
