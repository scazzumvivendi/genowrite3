import { liveQuery } from 'dexie';
import { useEffect, useState } from 'react';

export function useLocalQuery<T>(
  query: () => Promise<T>,
  dependencies: readonly unknown[],
) {
  const [result, setResult] = useState<{ value?: T; error?: string }>({});
  useEffect(() => {
    // Dexie può sopprimere DatabaseClosedError/AbortError nell’observer.
    // Catturare l’errore nella query garantisce un avviso anche durante il bootstrap.
    const subscription = liveQuery(async () => {
      try {
        return { value: await query() };
      } catch (reason) {
        return {
          error: reason instanceof Error ? reason.message : String(reason),
        };
      }
    }).subscribe({
      next: (result) =>
        setResult((previous) =>
          result.error === undefined
            ? result
            : { ...previous, error: result.error },
        ),
      error: (error: unknown) =>
        setResult((previous) => ({
          ...previous,
          error: error instanceof Error ? error.message : String(error),
        })),
    });
    return () => subscription.unsubscribe();
    // La query viene risottoscritta solo quando cambiano gli identificatori dichiarati.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  return result;
}
