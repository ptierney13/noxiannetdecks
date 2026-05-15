export const DESKTOP_HEADER_STAGE_BREAKPOINTS = {
  search: 640,
  nav: 768,
  full: 1024
} as const;

export type DesktopHeaderStage = "compact" | "search" | "nav" | "full";
export type HeaderShellMode = "mobile" | "desktop";

const HEADER_STAGE_HYSTERESIS = 24;
const HEADER_SHELL_BREAKPOINT = 640;
const HEADER_SHELL_HYSTERESIS = 24;

export function resolveHeaderShellMode(
  width: number,
  currentMode: HeaderShellMode = "mobile"
): HeaderShellMode {
  if (currentMode === "desktop") {
    return width < HEADER_SHELL_BREAKPOINT - HEADER_SHELL_HYSTERESIS ? "mobile" : "desktop";
  }

  return width >= HEADER_SHELL_BREAKPOINT + HEADER_SHELL_HYSTERESIS ? "desktop" : "mobile";
}

export function resolveDesktopHeaderStage(
  width: number,
  currentStage: DesktopHeaderStage = "compact"
): DesktopHeaderStage {
  if (currentStage === "full") {
    return width < DESKTOP_HEADER_STAGE_BREAKPOINTS.full - HEADER_STAGE_HYSTERESIS ? "nav" : "full";
  }

  if (currentStage === "nav") {
    if (width >= DESKTOP_HEADER_STAGE_BREAKPOINTS.full + HEADER_STAGE_HYSTERESIS) {
      return "full";
    }

    return width < DESKTOP_HEADER_STAGE_BREAKPOINTS.nav - HEADER_STAGE_HYSTERESIS ? "search" : "nav";
  }

  if (currentStage === "search") {
    if (width >= DESKTOP_HEADER_STAGE_BREAKPOINTS.nav + HEADER_STAGE_HYSTERESIS) {
      return "nav";
    }

    return width < DESKTOP_HEADER_STAGE_BREAKPOINTS.search - HEADER_STAGE_HYSTERESIS ? "compact" : "search";
  }

  return width >= DESKTOP_HEADER_STAGE_BREAKPOINTS.search + HEADER_STAGE_HYSTERESIS ? "search" : "compact";
}
