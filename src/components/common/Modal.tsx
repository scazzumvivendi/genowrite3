import { confirmDiscard } from './form-state';
import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

export function Modal({
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
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  function close() {
    if (!protectContent || confirmDiscard(ref.current)) {
      onClose();
    }
  }
  return (
    <dialog
      ref={ref}
      className="preferences-dialog product-dialog"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="panel-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Chiudi finestra"
          onClick={close}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
