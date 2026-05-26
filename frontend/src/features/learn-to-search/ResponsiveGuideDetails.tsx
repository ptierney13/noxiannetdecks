import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModalShell } from "../../ui-elements";
import { GuideDetailCard, type LtsDetailItem } from "./GuideDetailCard";
import { GuideDetailStream } from "./GuideDetailStream";

// The 1024px breakpoint is the explicit large-layout threshold throughout LTS.
const LARGE_BREAKPOINT_PX = 1024;

type ResponsiveGuideDetailsProps = {
  children: (onSelect: (item: LtsDetailItem) => void, selectedQueries: ReadonlySet<string>) => React.ReactNode;
  onAppend: (text: string) => void;
};

/**
 * Owns the detail selection state for Visual and Text guides.
 * - Below 1024px: single-select popup via ModalShell.
 * - At 1024px+: multi-select inline stream on the right half; no popup.
 *
 * Resize continuity:
 * - Shrink to small: preserve activeLarge in state, don't auto-open popup.
 * - New small selection: set activeLarge to that single item.
 * - Grow back to large with no new small selection: restore previous activeLarge.
 */
export function ResponsiveGuideDetails({ children, onAppend }: ResponsiveGuideDetailsProps) {
  const [isLarge, setIsLarge] = useState(
    () => window.matchMedia(`(min-width: ${LARGE_BREAKPOINT_PX}px)`).matches
  );
  const [activeLarge, setActiveLarge] = useState<LtsDetailItem[]>([]);
  const [activeSmall, setActiveSmall] = useState<LtsDetailItem | null>(null);
  // tracks whether the small selection was made while in small layout
  const madeSmallSelection = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LARGE_BREAKPOINT_PX}px)`);
    function handler(e: MediaQueryListEvent) {
      setIsLarge(e.matches);
      if (e.matches && !madeSmallSelection.current) {
        // grew back to large without a new small-layout selection: popup naturally cleared
        setActiveSmall(null);
      }
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSelect = useCallback((item: LtsDetailItem) => {
    const key = item.query ?? item.label;
    if (isLarge) {
      setActiveLarge((prev) => {
        const alreadyActive = prev.some((x) => (x.query ?? x.label) === key);
        if (alreadyActive) return prev.filter((x) => (x.query ?? x.label) !== key);
        return [item, ...prev];
      });
    } else {
      const alreadyActive = (activeSmall?.query ?? activeSmall?.label) === key;
      if (alreadyActive) {
        setActiveSmall(null);
        madeSmallSelection.current = false;
      } else {
        setActiveSmall(item);
        setActiveLarge([item]);
        madeSmallSelection.current = true;
      }
    }
  }, [isLarge, activeSmall]);

  const handleRemove = useCallback((item: LtsDetailItem) => {
    const key = item.query ?? item.label;
    setActiveLarge((prev) => prev.filter((x) => (x.query ?? x.label) !== key));
  }, []);

  const selectedQueries = useMemo(
    () => new Set(activeLarge.map((x) => x.query ?? x.label)),
    [activeLarge]
  );

  const closeSmall = useCallback(() => {
    setActiveSmall(null);
    madeSmallSelection.current = false;
  }, []);

  if (isLarge) {
    return (
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="min-w-0">{children(handleSelect, selectedQueries)}</div>
        <div className="sticky top-[calc(var(--site-header-height)+1rem)] self-start">
          <GuideDetailStream
            items={activeLarge}
            onRemove={handleRemove}
            onAppend={onAppend}
          />
        </div>
      </div>
    );
  }

  // In small layout only one item can be selected at a time; build a single-item set.
  const smallSelected = new Set(
    activeSmall ? [activeSmall.query ?? activeSmall.label] : []
  );

  return (
    <div>
      {children(handleSelect, smallSelected)}
      {activeSmall && (
        <ModalShell
          label={activeSmall.label}
          onClose={closeSmall}
          panelClassName="border-0 bg-transparent shadow-none"
          showCloseButton={false}
        >
          <div className="p-0">
            <GuideDetailCard item={activeSmall} onAppend={onAppend} onRemove={closeSmall} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}
