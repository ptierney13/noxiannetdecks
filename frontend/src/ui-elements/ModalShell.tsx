import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

export type ModalShellProps = {
  label: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  panelClassName?: string;
  showCloseButton?: boolean;
};

// Elements that can receive keyboard focus. Used to determine the focus cycle
// boundaries when Tab/Shift+Tab is pressed inside the dialog.
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export function ModalShell({
  label,
  children,
  onClose,
  className,
  panelClassName,
  showCloseButton = true,
}: ModalShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog on open. Restore the previously focused element
  // when the dialog closes so keyboard nav continues from where it left off.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();
    return () => {
      previouslyFocused?.focus();
    };
  }, []);

  // Trap Tab/Shift+Tab inside the panel and handle Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;

        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
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
        ref={panelRef}
        className={`@container relative w-full max-w-5xl rounded-[28px] border border-border-strong bg-surface-2 shadow-surface-2 ${panelClassName ?? ""}`}
        role="dialog"
        aria-label={label}
        aria-modal="true"
      >
        {showCloseButton ? (
          <button
            type="button"
            className="absolute right-4 top-4 z-10 grid min-h-11 min-w-11 place-items-center rounded-full border border-border-default bg-surface-glass text-text-secondary transition hover:border-border-strong hover:text-text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus-ring"
            onClick={onClose}
            aria-label="Close"
          >
            X
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
