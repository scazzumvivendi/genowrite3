import { useEffect } from 'react';
import { useLocalQuery } from './useLocalQuery';
import { readSync, syncTick } from '../modules/dropbox/sync';
import type { DraftSaver } from '../modules/storage/draft-saver';

export function useDropboxSync(
  id: string,
  saver: DraftSaver,
  suspended: boolean,
) {
  const query = useLocalQuery(() => readSync(id), [id]);
  useEffect(() => {
    if (!query.value?.enabled || suspended) {
      return;
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void syncTick(id, () => saver.flush());
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [id, saver, suspended, query.value?.enabled]);
  return query;
}
