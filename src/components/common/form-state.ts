export function hasUnsavedFields(root: Element | null) {
  const controls =
    root?.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >('input, textarea, select') ?? [];
  return [...controls].some((control) => {
    if (control instanceof HTMLSelectElement) {
      return [...control.options].some(
        (option) => option.selected !== option.defaultSelected,
      );
    }
    if (
      control instanceof HTMLInputElement &&
      ['checkbox', 'radio'].includes(control.type)
    ) {
      return control.checked !== control.defaultChecked;
    }
    return control.value !== control.defaultValue;
  });
}
export function confirmDiscard(root: Element | null) {
  return (
    !hasUnsavedFields(root) ||
    window.confirm(
      'Ci sono modifiche non salvate in questa finestra. Vuoi abbandonarle?',
    )
  );
}
export function markFormSaved(root: Element) {
  for (const control of root.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input, textarea, select')) {
    if (control instanceof HTMLSelectElement) {
      for (const option of control.options) {
        option.defaultSelected = option.selected;
      }
    } else if (
      control instanceof HTMLInputElement &&
      ['checkbox', 'radio'].includes(control.type)
    ) {
      control.defaultChecked = control.checked;
    } else {
      control.defaultValue = control.value;
    }
  }
}
