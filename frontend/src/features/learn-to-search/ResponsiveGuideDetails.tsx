import { useCallback, useEffect, useRef, useState } from "react";
import { ModalShell } from "../../ui-elements";
import { GuideDetailCard, type LtsDetailItem } from "./GuideDetailCard";
import { GuideDetailStream } from "./GuideDetailStream";

// The 1024px breakpoint is the explicit large-layout threshold throughout LTS.
const LARGE_BREAKPOINT_PX = 1024;

type ResponsiveGuideDetailsProps = {
  children: (onSelect: (item: LtsDetailItem) => void) => React.ReactNode;
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
    if (isLarge) {
      setActiveLarge((prev) => {
        const filtered = prev.filter((x) => x.label !== item.label || x.category !== item.category);
        return [item, ...filtered];
      });
    } else {
      setActiveSmall(item);
      // promote to single-item large list for when viewport grows back
      setActiveLarge([item]);
      madeSmallSelection.current = true;
    }
  }, [isLarge]);

  const handleRemove = useCallback((item: LtsDetailItem) => {
    setActiveLarge((prev) =>
      prev.filter((x) => x.label !== item.label || x.category !== item.category)
    );
  }, []);

  const closeSmall = useCallback(() => {
    setActiveSmall(null);
    madeSmallSelection.current = false;
  }, []);

  if (isLarge) {
    return (
      <div className="grid grid-cols-2 gap-6 items-start">
        <div>{children(handleSelect)}</div>
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

  return (
    <div>
      {children(handleSelect)}
      {activeSmall && (
        <ModalShell label={activeSmall.label} onClose={closeSmall}>
          <div className="p-6">
            <GuideDetailCard item={activeSmall} onAppend={onAppend} onRemove={closeSmall} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}
