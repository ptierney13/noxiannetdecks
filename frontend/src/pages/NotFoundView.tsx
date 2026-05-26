import type { MouseEvent } from "react";
import { NoxianLogoIcon } from "../ui-elements";

type NotFoundViewProps = {
  onNavigate: (href: string) => void;
};

export function NotFoundView({ onNavigate }: NotFoundViewProps) {
  function handleHomeClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    e.preventDefault();
    onNavigate("/");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-7 px-4 py-16 min-h-[calc(100svh-var(--site-header-height))]">
      <NoxianLogoIcon className="w-[152px] h-[152px] sm:w-[192px] sm:h-[192px] opacity-80" />
      <div className="text-center">
        <p className="eyebrow">404</p>
        <h1 className="text-text-primary text-[2rem] sm:text-[2.5rem] font-bold tracking-[-0.03em] mt-1 mb-2 leading-tight">
          Page Not Found
        </h1>
        <p className="text-text-secondary text-base">
          That URL isn't mapped to anything on this site.
        </p>
      </div>
      <a
        href="/"
        onClick={handleHomeClick}
        className="inline-flex items-center px-5 py-2.5 rounded-[var(--radius-sm)] bg-accent hover:bg-accent-hover text-white font-semibold text-sm transition-colors"
      >
        Back to Home
      </a>
    </div>
  );
}
