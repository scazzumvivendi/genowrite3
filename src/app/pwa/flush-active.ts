let flush: () => Promise<void> = async () => undefined;
export function registerActiveFlush(callback: () => Promise<void>) {
  flush = callback;
  return () => {
    if (flush === callback) {
      flush = async () => undefined;
    }
  };
}
export function flushActive() {
  return flush();
}
