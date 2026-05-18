import type { ReactNode } from "react";

export function StorybookViewportFrame({
  mode,
  mobileWidth = 393,
  desktopWidth,
  children,
}: {
  mode: "desktop" | "mobile";
  mobileWidth?: number;
  desktopWidth?: number;
  children: ReactNode;
}) {
  const widthStyle =
    mode === "mobile"
      ? { width: "100%", maxWidth: `${mobileWidth}px` }
      : desktopWidth
        ? { width: `${desktopWidth}px`, maxWidth: `${desktopWidth}px` }
        : undefined;

  const outerClass =
    mode === "mobile"
      ? "min-h-screen p-[1.5rem_1rem_2.5rem] overflow-auto grid justify-center content-start overflow-x-auto"
      : "min-h-screen p-6 overflow-auto";

  const innerClass =
    mode === "mobile"
      ? "w-full max-w-[393px] min-h-[852px] flex-none mx-auto"
      : "w-[min(100%,1280px)] mx-auto";

  return (
    <div className={outerClass}>
      <div className={innerClass} style={widthStyle}>
        {children}
      </div>
    </div>
  );
}
