import { QueryChip } from "../../ui-elements";

export type LtsDetailItem = {
  label: string;
  category?: string;
  description: string;
  query?: string;
  shorthand?: string;
  examples?: string[];
};

type LtsDetailOverlayProps = {
  item: LtsDetailItem | null;
  onClose: () => void;
  onAppend: (text: string) => void;
};

export function LtsDetailOverlay({ item, onClose, onAppend }: LtsDetailOverlayProps) {
  if (!item) return null;

  return (
    <div
      className="lts-detail-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
      onClick={onClose}
    >
      <div
        className="lts-detail-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lts-detail-header">
          {item.category && (
            <span className="lts-detail-category">{item.category}</span>
          )}
          <span className="lts-detail-title">{item.label}</span>
          <button
            type="button"
            className="lts-detail-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" strokeWidth="2.5" stroke="currentColor" fill="none">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="lts-detail-description">{item.description}</p>

        {(item.query || item.shorthand) && (
          <div className="lts-detail-syntax-block">
            {item.query && (
              <div className="lts-detail-syntax-row">
                <span className="lts-detail-syntax-label">Syntax</span>
                <div className="lts-detail-syntax-chips">
                  {item.query.split(/\s+/).map((token) => (
                    <QueryChip key={token} text={token} onAppend={onAppend} />
                  ))}
                </div>
              </div>
            )}
            {item.shorthand && (
              <div className="lts-detail-syntax-row">
                <span className="lts-detail-syntax-label">Shorthand</span>
                <div className="lts-detail-syntax-chips">
                  {item.shorthand.split(/\s+or\s+/i).map((token) => (
                    <QueryChip key={token} text={token.trim()} onAppend={onAppend} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {item.examples && item.examples.length > 0 && (
          <div className="lts-detail-examples-block">
            <span className="lts-detail-syntax-label">Examples</span>
            <div className="lts-detail-examples">
              {item.examples.map((ex) => (
                <QueryChip key={ex} text={ex} onAppend={onAppend} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
