import { useEffect, useRef, type ReactNode } from 'react';
import { confirmDiscard } from './form-state';
import { t } from '../../i18n';

export function Screen({
  title,
  onClose,
  children,
  protectContent = true,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  protectContent?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  function close() {
    if (!protectContent || confirmDiscard(root.current)) {
      onClose();
    }
  }
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <main
      ref={root}
      className="backup-screen product-dialog"
      aria-label={title}
    >
      <header>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <button onClick={close}>{t('chiudi_finestra_e40186')}</button>
      </header>
      {children}
    </main>
  );
}
