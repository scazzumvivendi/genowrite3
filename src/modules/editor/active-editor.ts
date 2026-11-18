let active: (() => () => void) | undefined;
export function registerEditorLock(lock: () => () => void) {
  active = lock;
  return () => {
    if (active === lock) {
      active = undefined;
    }
  };
}
export function lockActiveEditor() {
  return active?.() ?? (() => undefined);
}
