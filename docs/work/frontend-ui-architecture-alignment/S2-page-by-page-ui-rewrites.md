# Stage 7: Page-by-Page UI Rewrites

> Status: plan

## Summary

Stage 7 rewrites each legacy page one at a time. Every page gets a full
visual overhaul — not a translation of existing styles. The user provides a
mockup image, the agent reads the current page code and the available `ui-elements/`
component inventory (built in Stages 5–6), and together they produce a
concrete durable plan document before any implementation code is written. Each
page is executed and approved independently before the next begins.

TanStack Query is wired in during each rewrite. There is no separate
data-loading stage.

## Confirmed decisions this stage inherits

| Concern | Decision |
|---|---|
| Styling | Tailwind only. No new `styles.css` selectors. Remove replaced selectors from `styles.css` as each page is done. |
| Data loading | TanStack Query per page. Wire `useQuery` during the rewrite; do not leave `useEffect` data fetches in place. |
| Routing | TanStack Router is settled. Only fix route search param schemas if the page rewrite requires it. |
| Shared components | Use existing `ui-elements/` and `features/` components first. Propose new shared components only when no existing component fits. New shared components go to `ui-elements/` or `features/` with Storybook coverage before being used in the page. |
| Visual target | Mockups are organizational guides, not pixel-perfect specs. Match the visual intent; iterate with the user before finalizing. |

## Execution Order

Execute in this order unless the user redirects. Earlier pages tend to establish
shared components that later pages reuse.

1. **Card Search** (`SearchView.tsx`)
2. **Card Detail** (`CardDetailView.tsx`)
3. **Learn to Search** (`LearnToSearchView.tsx`)
4. **Query Builder** (`QueryBuilderView.tsx`)
5. **Deck Explorer** (`DeckExplorerView.tsx`)
6. **Tier List** (`TierListView.tsx`)
7. **Sealed Simulator** (`SealedSimulator.tsx`)
8. **Trade Balancer** (`TradeBalancerView.tsx`)

## Pre-Step: Establish `data/` Structure

Before the first page rewrite begins, agree on and document the `data/` layer
structure. Stage 4 created the skeleton (`data/queryClient.ts` and
`data/index.ts`). This pre-step adds the conventions all page rewrites must
follow, so the first subagent does not set an inconsistent precedent.

Agree on and record in this plan:

1. **Query key convention** — how keys are named and structured, e.g.:
   ```ts
   // Option A: plain array keys
   ["cards", cardId]
   ["cards", "search", query]
   ["query-features"]

   // Option B: factory objects
   cardKeys.detail(cardId)
   cardKeys.search(query)
   ```
   Pick one and document it. All pages must use the same convention.

2. **File structure inside `data/`** — one file per resource domain, e.g.:
   ```
   data/
     queryClient.ts    — QueryClient instance (created in Stage 4)
     cards.ts          — card query keys and queryOptions
     queryFeatures.ts  — query feature data keys and queryOptions
     index.ts          — barrel
   ```
   Each page rewrite that needs a new resource adds a file here following
   the same pattern.

3. **Route loader policy** — decide once whether page rewrites should add
   TanStack Router `loader` functions calling `queryClient.ensureQueryData()`,
   or whether `useQuery` in the component is sufficient for now. Record
   the decision; do not leave it to each subagent to choose independently.

This pre-step produces a short addendum to this plan file before execution
of the first page begins. The user does not need to approve a separate plan —
record the decisions as a new section here and proceed.

## Per-Page Process

Each page follows this exact sequence. Do not skip steps.

When the user asks to plan a Stage 7 page rewrite, create or update that page's
subordinate plan file under `docs/work/frontend-ui-architecture-alignment/`.
Do not treat the chat response alone as the plan. The chat response should
summarize the durable document and call out any decisions that still need user
approval.

### Step 1 — Inventory

Before looking at the mockup, read:
- The full current page file
- `ui/index.ts` — available shared components
- `features/` barrel exports — available feature components
- The Stage 5 component manifest — reference for what Home extracted

Produce a one-paragraph summary of what the page currently does and what
data it loads.

### Step 2 — Mockup review

The user provides a mockup image. Read it and identify each distinct visual
region. For each region, note:
- What it contains (data, controls, labels)
- Whether an existing shared component could serve it
- Whether a new shared component is warranted
- Whether it is justified as page-specific

### Step 3 — Draft plan

Create or update the page-specific plan document before presenting the draft to
the user. Use a descriptive filename such as
`query-builder-tailwind-rewrite-plan.md`; these files are subordinate to this
Stage 7 plan and do not need top-level `work-status.json` entries unless the
initiative README says otherwise.

Produce a table:

```
Visual region     | Approach          | Component / rationale
------------------|-------------------|----------------------
Search input      | existing ui/      | SearchInput (extracted from Home)
Results grid      | new ui/           | CardGrid — generic enough for Detail too
Sort controls     | page-specific     | simple enough to inline; only used here
Diagnostics panel | new ui/           | AlertBanner — reusable warning surface
...
```

Also list:
- Any new shared components proposed (name, props, where it goes)
- The TanStack Query hook(s) needed (resource name, query key shape)
- Any `styles.css` selectors this page owns that will be deleted

Present the durable draft plan to the user. Writing or updating the plan
document is expected; do not write implementation code until the user approves
the page plan.

### Step 4 — Iteration

Discuss the plan with the user. Adjust component choices, layout decisions,
and visual targets based on feedback. Update the table. Repeat until the
user approves the plan.

### Step 5 — Execute

Build any new shared components first (with Storybook stories), then rewrite
the page using them. Wire TanStack Query. Remove replaced `styles.css`
selectors.

### Step 6 — Review

- Run tests and build
- Open the page in the browser and verify visuals match the agreed mockup intent
- Review Storybook stories for any new components
- Report: what was built, what components are now in `ui/` or `features/`,
  what `styles.css` selectors were removed

## Shared Component Rules

When a new shared component is proposed:

- It must be genuinely reusable — if only the current page will ever use it,
  keep it page-local
- It must be built and have Storybook coverage before the page that uses it
  is finalized
- It goes to `ui/` if it has no card/game domain knowledge
- It goes to `features/` if it has domain knowledge and is used by 2+ pages
- Its name and props must be agreed with the user before implementation

## TanStack Query Integration Per Page

For each page with data loading:
- Create query key factories and `queryOptions` in `src/data/` (create `data/`
  if it does not exist yet; add a barrel `index.ts`)
- Replace `useEffect` data fetches with `useQuery(queryOptions)`
- Handle `isPending`, `isError`, and `data` states using `ui/` shared
  loading/error components
- Route loaders calling `queryClient.ensureQueryData()` are optional for now;
  add them if prefetching is clearly beneficial for that route

## styles.css Drawdown

After all 8 pages are rewritten, `styles.css` should contain only:
- The `:root` CSS variable declarations (`--color-*` tokens)
- The `body`, `*`, `button/input/select` resets
- The `site-header`, `site-nav`, and shell-level selectors owned by `AppShell`
  (these are migrated in a separate AppShell Tailwind pass, not in Stage 7)

Any other selector remaining after all pages are done is a leftover that must
be removed or explicitly justified.

## Cleanup After All Pages Complete

Once all 8 pages are done:
1. Delete `App.test.tsx` — tests must be co-located with their source files by now
2. Verify zero `useEffect` data-fetching patterns remain across all page files
3. Refresh `frontend/UI_ARCHITECTURE.md` and nested `AGENTS.md` files to
   reflect the final structure
4. Record any intentional exceptions (things left in `styles.css`, things that
   stayed page-local) with explicit justification

## Test Plan (per page and final)

Per page:
- `npm run test -w @noxiannet/frontend`
- `npm run build -w @noxiannet/frontend`
- `npm run build-storybook -w @noxiannet/frontend`
- Browser visual review against mockup

Final (after all pages):
- All of the above
- Confirm `App.test.tsx` disbanded and tests are co-located
- Confirm `styles.css` contains only tokens, resets, and AppShell selectors
- Confirm `ui/` and `features/` barrel exports are complete and accurate
- Confirm docs reflect the final architecture

## Exit Criteria (initiative completion)

- All 8 legacy pages rewritten in Tailwind with correct visual design
- All pages use TanStack Query for data loading; zero `useEffect` data fetches remain
- `styles.css` reduced to tokens, resets, and AppShell selectors only
- Shared components in `ui/` and `features/` with Storybook coverage
- `App.test.tsx` disbanded; tests co-located
- Docs updated to reflect final architecture
- User has approved the visual output of each page
