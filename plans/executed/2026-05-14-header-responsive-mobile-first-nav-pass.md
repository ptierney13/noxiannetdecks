# Header Responsive Mobile-First Nav Pass

## Summary

Refine the shared site header so its responsive behavior follows the project’s
mobile-first UI architecture more closely while preserving the always-available
search field. The goal is to make the desktop header scale down gracefully
toward the mobile model instead of holding a rigid desktop composition until a
hard viewport switch.

## Key Changes

- Update the shared header architecture so the desktop header progressively
  simplifies as width decreases.
- Keep the search field present across sizes and update its placeholder text to
  `Search for Riftbound Cards`.
- Add an intermediate compact-header behavior where:
  - the `Noxian Netdecks` wordmark drops away first, leaving only the logo
  - the hamburger toggle appears next to the remaining desktop controls before
    the full mobile navigation takeover
- Allow the search submit button to disappear at narrower widths when space is
  tight, while keeping the search input usable.
- Ensure Storybook header and homepage stories reflect the same responsive
  header behavior so shrinking the desktop review surface approaches the mobile
  header interaction model.
- Keep the mobile drawer behavior purpose-built and preserve tap-friendly
  interaction targets.

## Test Plan

- Run `npm run test -w @noxiannet/frontend`
- Run `npm run test:storybook -w @noxiannet/frontend`
- Run `npm run build -w @noxiannet/frontend`
- Run `npm run build-storybook -w @noxiannet/frontend`
- Restart Storybook fresh and manually verify:
  - desktop header at wide width
  - compact desktop header after wordmark removal
  - compact desktop header with hamburger visible
  - narrow/mobile header with drawer behavior
  - search field persistence and placeholder text across widths

## Assumptions

- This pass is limited to shared header behavior and Storybook review fidelity,
  not a full navigation information architecture rewrite.
- The search input remains the primary persistent control at all sizes.
- The hamburger introduced before full mobile takeover may be a compact-shell
  affordance that shares the same drawer model as the mobile nav if that
  produces the clearest behavior.
