import { useEffect, useRef, type ReactNode } from 'react';
import { t } from '../../i18n';

export function Screen({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <main className="backup-screen product-dialog" aria-label={title}>
      <header>
        <h1 ref={heading} tabIndex={-1}>
          {title}
        </h1>
        <button onClick={onClose}>{t('chiudi_finestra_e40186')}</button>
      </header>
      {children}
    </main>
  );
}
