// Layout breakpoints — these values mirror Tailwind's default --breakpoint-* theme values
// (sm: 640, md: 768, lg: 1024, xl: 1280). CSS container queries use @sm: / @md: / @lg: / @xl:
// variants which resolve to the same values at build time. If you change these, update
// the Tailwind theme in ui-foundation.css @theme block to match, and vice versa.
export const LayoutModeBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;
