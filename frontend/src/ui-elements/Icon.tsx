export function NoxianLogoIcon({ size = 128, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/design-assets/NoxianLogo.png"
      alt="Noxian Netdecks"
      className={`shrink-0 object-contain ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}

export function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path
        d="m20.7 19.3-4.2-4.2a7.5 7.5 0 1 0-1.4 1.4l4.2 4.2a1 1 0 0 0 1.4-1.4ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CardsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M6 3h10a2 2 0 0 1 2 2v13H8a2 2 0 0 1-2-2V3Zm2 2v11h8V5H8Zm-2 15h12v2H6a4 4 0 0 1-4-4V7h2v11a2 2 0 0 0 2 2Z" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false" className="w-[1.3rem] h-[1.3rem]">
      {open ? (
        <path d="M6 6 18 18M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      )}
    </svg>
  );
}

export function TradeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M7 7h8.5l-2.7-2.7L14.2 3 19 7.8l-4.8 4.8-1.4-1.3L15.5 9H7V7Zm10 8H8.5l2.7 2.7-1.4 1.3L5 14.2l4.8-4.8 1.4 1.3L8.5 13H17v2Z" fill="currentColor" />
    </svg>
  );
}

export function SealedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <rect x="4.5" y="7.5" width="15" height="11.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 7.5c0-1.7 1.6-3 5-3s5 1.3 5 3" fill="none" opacity="0.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h8M12 8.8v6.4" fill="none" opacity="0.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  );
}

export function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      focusable="false"
      className={`w-4 h-4 transition-transform duration-[160ms] ease${expanded ? " rotate-180" : ""}`}
    >
      <path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z" fill="currentColor" />
    </svg>
  );
}
