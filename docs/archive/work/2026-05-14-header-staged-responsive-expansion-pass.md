Summary

Implement a staged desktop-header expansion model for the shared home/shell navigation so the compact inline row grows progressively instead of switching three behaviors at once. Preserve the mobile-approved inline search row as the compact baseline, then promote features in ordered stages using the repository's standard responsive breakpoints and smooth CSS transitions.

Key changes

- Replace the current binary compact-desktop threshold logic with explicit staged header expansion states derived from shared responsive breakpoints.
- Use the mobile-approved inline search row as the source of truth for the smallest desktop compact state.
- Stage 1 at the first reasonable longform width:
  add the `Search` button back to the compact inline row once the header container is wide enough to support the inline search field, button, and hamburger without crowding.
  Planned threshold: `640px` container width, matching the first standard expansion breakpoint and the earliest width where the longform search control should read intentionally rather than cramped.
- Stage 2 at the next expansion width:
  replace the hamburger-only compact controls with the full dropdown navigation groups once the header container is wide enough for the search surface plus direct nav actions.
  Planned threshold: `768px` container width, matching the next shared breakpoint and providing a clear middle state between compact utility search and full desktop nav.
- Stage 3 at the next expansion width:
  add back the `Noxian Netdecks` wordmark once the header has enough width for brand text without compressing the search and nav actions.
  Planned threshold: `1024px` container width, aligning the final full desktop header with the existing shell-level desktop breakpoint already used elsewhere in the system.
- Refactor the app and Storybook header preview state so they derive from the same staged header mode model instead of ad hoc booleans.
- Add or adjust CSS transitions for opacity, padding, gap, and width-related properties so mode changes feel progressive rather than abrupt, while avoiding layout-jank-heavy animation on properties that cannot transition cleanly.
- Update Storybook header stories if needed so the staged states can be reviewed at representative widths.

Test plan

- Run `npm.cmd run test:storybook -w @noxiannet/frontend`.
- Run `npm.cmd run test -w @noxiannet/frontend` if header state logic changes affect the real app shell.
- Run `npm.cmd run build -w @noxiannet/frontend`.
- Manually verify in Storybook:
  - compact inline state below `640px`
  - compact inline plus `Search` button at `640px` and above
  - full dropdown nav without wordmark at `768px` and above
  - full desktop nav with wordmark at `1024px` and above
  - transitions feel gradual when resizing through each threshold

Assumptions

- It is acceptable to replace the current measured `960px` compact switch with standardized staged thresholds tied to the shared responsive system.
- The user-approved mobile inline row remains the correct baseline contract for compact desktop.
- Smoothness should come primarily from staged layout progression plus lightweight transitions, not from trying to animate every structural display change.
