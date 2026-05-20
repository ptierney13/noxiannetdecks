import type { ReactNode } from "react";

export type StorybookViewport = "Mobile" | "DesktopSmall" | "Desktop" | "DesktopWide";

const VIEWPORT_WIDTHS: Record<StorybookViewport, number> = {
  Mobile: 393,
  DesktopSmall: 700,
  Desktop: 900,
  DesktopWide: 1280,
};

export function StorybookViewportFrame({
  viewport,
  width,
  children,
}: {
  viewport: StorybookViewport;
  /** Override the canonical width for edge-case testing (e.g. exactly 767px). */
  width?: number;
  children: ReactNode;
}) {
  const resolvedWidth = width ?? VIEWPORT_WIDTHS[viewport];
  const isMobile = viewport === "Mobile";

  const widthStyle = isMobile
    ? { width: "100%", maxWidth: `${resolvedWidth}px` }
    : { width: `${resolvedWidth}px`, maxWidth: `${resolvedWidth}px` };

  const outerClass = isMobile
    ? "min-h-screen p-[1.5rem_1rem_2.5rem] overflow-auto flex justify-center items-start overflow-x-auto"
    : "min-h-screen p-6 overflow-auto";

  const innerClass = isMobile
    ? "w-full max-w-[393px] min-h-[852px] mx-auto"
    : "w-full mx-auto";

  return (
    <div className={outerClass}>
      <div className={innerClass} style={widthStyle}>
        {children}
      </div>
    </div>
  );
}
