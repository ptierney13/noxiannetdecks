# Query Builder Tailwind Rewrite Plan

> Status: plan
> Implementation approval: not yet approved. Do not write implementation code
> from this plan until the user approves it.

## Summary

Rewrite the Query Builder page out of `frontend/src/pages/legacy/` and into the
current Stage 7 page pattern. The migrated page should preserve the existing
query-building behavior, keep the live card-search preview, remove the
Query Builder-owned legacy CSS selectors, and add Storybook/test coverage for
the route-level surface.

The current page already uses TanStack Router navigation, the shared
`CardSearchResultsPane`, and the shared `useDebounce` hook. The main migration
work is moving it out of legacy, replacing `qb-*` CSS with Tailwind classes,
and making the page reviewable in Storybook.

## Current Inventory

- Page file: `frontend/src/pages/legacy/QueryBuilderView.tsx`
- Route owner: `frontend/src/app/router.tsx`
- Shared feature already used: `CardSearchResultsPane` from `features/`
- Shared utility already used: `useDebounce` from `lib/`
- Legacy CSS owner: Query Builder block in `frontend/src/styles.css`
- Legacy selector variables: `.qb-domain-chip` and `.qb-rarity-chip` rules in
  `frontend/src/ui-foundation.css`
- Current page coverage: no Query Builder page story or focused page test

## Key Changes

- Move `QueryBuilderView.tsx` to `frontend/src/pages/QueryBuilderView.tsx`.
- Update `frontend/src/app/router.tsx` to import the migrated page.
- Preserve generated query semantics:
  - selected values within a group combine with `or`
  - groups combine as space-separated query clauses
  - text values are quoted when needed
  - empty query navigates to `/cards`
- Keep `CardSearchResultsPane` on the page and continue passing a debounced
  generated query into it.
- Replace all `qb-*` CSS classes with Tailwind utility classes on the component.
- Delete the Query Builder-owned CSS block from `styles.css`.
- Remove Query Builder-specific selector-variable rules from `ui-foundation.css`
  while keeping reusable domain and rarity token declarations.
- Add route-level Storybook coverage for the migrated page.
- Add focused test coverage for the generated-query and search-navigation
  behavior.

## Visual Region Plan

| Visual region | Approach | Component / rationale |
|---|---|---|
| Page frame | page-local Tailwind | Query Builder is route-specific; no shared extraction needed. |
| Header and description | page-local Tailwind | Preserve the page purpose while matching current page typography. |
| Built query preview | page-local helper component | Route-specific output with aria-live behavior. |
| Filter sections | page-local helper components | `QueryBuilderSection`, `TextField`, and `StatRow` reduce repetition without creating premature shared UI. |
| Toggle chips | page-local helper component | Chips are tightly coupled to query syntax and selected-set state for this page. |
| Domain and rarity chips | page-local token maps | Use existing `--domain-*` and `--rarity-*` tokens without selector-variable indirection. |
| Stats controls | page-local Tailwind | Preserve operator/value behavior and mobile stacking. |
| Search action | page-local button using shared icon | Preserve navigation to `/cards` with query search params. |
| Live preview | existing `CardSearchResultsPane` | Already owns TanStack Query data loading and result states. |

## Implementation Units

1. Page move and route import
   - Move the file from `pages/legacy/` to `pages/`.
   - Update the route import in `app/router.tsx`.

2. Local component cleanup
   - Keep Query Builder-specific helpers in the page file unless they become
     meaningfully reusable.
   - Use Tailwind for layout, surfaces, chip states, focus rings, and form
     controls.
   - Keep static visual values in classes or semantic token references; do not
     add new `styles.css` rules.

3. Legacy CSS removal
   - Delete the Query Builder section in `styles.css`, currently beginning at
     `.qb-panel`.
   - Delete `.qb-domain-chip` and `.qb-rarity-chip` selector-variable rules from
     `ui-foundation.css`.
   - Keep reusable `--domain-*` and `--rarity-*` token declarations because
     other card UI still uses them.

4. Storybook and tests
   - Add `frontend/src/pages/QueryBuilderView.stories.tsx`.
   - Cover default/empty, populated, and narrow viewport states.
   - Add a focused test for query generation and search navigation. Prefer
     testing through user-visible controls; extract a tiny pure query builder
     helper only if the render-level test becomes brittle.

5. Verification
   - Run the normal frontend validation commands.
   - Manually inspect `/cards/query-builder` on mobile and desktop.
   - Inspect the Query Builder Storybook stories.

## Data And Routing

No new data-layer resource is expected for Query Builder itself. The live
preview continues to rely on `CardSearchResultsPane`, which already uses
`useCardSearchResults` from `frontend/src/data/cards.ts`.

Route definitions remain in `frontend/src/app/router.tsx`; do not create a
`src/routes/` directory for this page.

## Test Plan

- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run test:storybook -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`
- Browser check `/cards/query-builder`
- Storybook check `Pages/QueryBuilderView`

## Assumptions

- The current generated query grammar is correct and should not be redesigned
  during this migration.
- The current live-preview behavior is desired: results update after a short
  debounce and the full search button navigates to `/cards`.
- New shared components are not warranted unless the mockup or implementation
  reveals reuse with another page.

## Open Questions

- Does the user want to provide a visual mockup before implementation, as Stage
  7 normally expects?
- If no mockup is provided, should the implementation preserve the current
  two-column organization as the behavioral baseline while restyling it in the
  current Tailwind system?
- Should the migrated page expose a reset/clear-all action, or should the
  behavior remain exactly as-is for this pass?

## Risks

- Rewriting chip styling without preserving selected-set semantics could change
  generated query strings.
- Duplicating card-search result controls inside Query Builder would drift from
  `CardSearchResultsPane`; the page should continue delegating preview behavior.
- Leaving `qb-*` selectors in either CSS file would make the migration look done
  while keeping legacy styling alive.
- Adding shared UI too early would increase API surface for controls that may
  remain unique to this page.
