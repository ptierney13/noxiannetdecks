import { useEffect, type MouseEvent, type ReactNode } from "react";

export type ModalShellProps = {
  label: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  panelClassName?: string;
};

export function ModalShell({
  label,
  children,
  onClose,
  className,
  panelClassName,
}: ModalShellProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/72 px-4 py-6 backdrop-blur-sm ${className ?? ""}`}
      onMouseDown={handleBackdropMouseDown}
      role="presentation"
    >
      <div
        className={`@container relative w-full max-w-5xl rounded-[28px] border border-border-strong bg-surface-2 shadow-surface-2 ${panelClassName ?? ""}`}
        role="dialog"
        aria-label={label}
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute right-4 top-4 z-10 grid min-h-11 min-w-11 place-items-center rounded-full border border-border-default bg-surface-glass text-text-secondary transition hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring"
          onClick={onClose}
          aria-label="Close"
        >
          X
        </button>
        {children}
      </div>
    </div>
  );
}
