export const DESKTOP_HEADER_STAGE_BREAKPOINTS = {
  search: 640,
  nav: 768,
  full: 1024
} as const;

export type DesktopHeaderStage = "compact" | "search" | "nav" | "full";

export function resolveDesktopHeaderStage(width: number): DesktopHeaderStage {
  if (width >= DESKTOP_HEADER_STAGE_BREAKPOINTS.full) {
    return "full";
  }

  if (width >= DESKTOP_HEADER_STAGE_BREAKPOINTS.nav) {
    return "nav";
  }

  if (width >= DESKTOP_HEADER_STAGE_BREAKPOINTS.search) {
    return "search";
  }

  return "compact";
}
