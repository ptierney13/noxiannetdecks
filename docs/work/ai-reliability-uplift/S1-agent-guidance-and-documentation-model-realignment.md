# Stage 1: Agent Guidance And Documentation Model Realignment

> Status: completed

> See also:
> [reference-claude-codex-discovery-audit.md](./reference-claude-codex-discovery-audit.md)
> for the Claude/Codex cold-start findings this stage is expected to address.

## Summary

Stage 1 is a documentation-only stage that establishes the repo's target
documentation architecture, makes repo guidance usable on a cold start for both
Codex and Claude, adds package-local routing and invariants for the
non-frontend workspaces, and replaces the current planning-surface assumptions
with the new `docs/work/` and `docs/archive/` model.

This stage does not change product behavior, source schemas, or runtime code.
Its goal is to make the repo's operating contract discoverable and accurate:

- Every meaningful `AGENTS.md` must have a parallel `CLAUDE.md` in the same
  directory whose role is to forward Claude into the authoritative
  `AGENTS.md`.
- Claude must be explicitly routed from each `CLAUDE.md` to its paired
  `AGENTS.md`.
- The repo must adopt one explicit documentation model instead of splitting
  active planning between `plans/` and ad hoc docs.
- `card_store/`, `price_store/`, and `deck_store/` each need current,
  workspace-specific guidance.
- Repo-local Codex skills should live under `.agents/skills/`.

## Scope Decisions

- Stage 1 includes updates to root `AGENTS.md` and `CLAUDE.md`, new paired
  `AGENTS.md` / `CLAUDE.md` files for `card_store/`, `price_store/`, and
  `deck_store/`, and the documentation-surface reorganization needed to define
  the new model.
- Stage 1 defines the target doc structure as:
- `README.md` files for repo/folder semantics and durable principles
- `docs/reference/` for evergreen reference and policy
- `docs/runbooks/` for repeatable operational procedures
- `docs/work/` for active initiative folders plus initiative-level indexing
- `docs/archive/` for completed or superseded historical docs
- `.agents/skills/` for repo-local Codex skills
- Stage 1 should migrate the documentation contract to this model even if that
  requires changing assumptions from older plans.
- Stage 1 should establish the `AGENTS.md` / `CLAUDE.md` pairing rule as a
  root invariant for future folders that carry agent guidance.
- `deck_store/` is treated as an implemented workspace with archive/audit/data
  responsibilities, not as a placeholder package.
- Root and workspace guidance should route agents to live source files and docs
  only. Stale draft references like `card_store/src/data/source.ts`,
  `src/packs/`, or `price_store/data/raw/` must not survive into the final
  docs.

## Key Changes

- Update root cold-start guidance so the `AGENTS.md` / `CLAUDE.md` pairing rule
  is explicit and Claude is always routed into the authoritative `AGENTS.md`.
- Replace the current active planning/doc assumptions with the new README +
  `docs/reference|runbooks|work|archive` model and the `docs/work/work-status.json`
  index.
- Add new workspace-specific paired `AGENTS.md` / `CLAUDE.md` files for
  `card_store/`, `price_store/`, and `deck_store/` using the current live repo
  layout rather than stale draft assumptions.
- Add root task routing and search-hygiene guidance so agents can find the
  right docs without confusing live instructions with archived worktree copies.

## Implementation Units

### U1: Root guidance invariants and `AGENTS.md` / `CLAUDE.md` pairing contract

Files:
- `CLAUDE.md`
- `AGENTS.md`

Changes:
- Add a top-level invariant in root `AGENTS.md` that every directory with an
  `AGENTS.md` must also have a parallel `CLAUDE.md` in the same directory.
- Standardize the forwarding contract for those paired Claude files: each local
  `CLAUDE.md` should stay minimal and use the literal `@AGENTS.md` forwarder
  form so Claude is routed into the authoritative `AGENTS.md` in the same
  folder rather than maintaining duplicate guidance.
- Update root `CLAUDE.md` so it explicitly instructs Claude to read root
  `AGENTS.md` at session start before doing work.
- Update root-level guidance to point repo-local Codex skills at
  `.agents/skills/` as the target convention for this repo.
- Add root guidance for mid-execution approval heuristics so agents self-approve
  plan-explicit changes, repo-local read requests, and any future allowlisted
  self-approval patterns before interrupting the user.
- Require agents to aggregate any approval requests they do send into
  live-derived categorized numerical counts in their after-work summary, and
  report only categories with non-zero counts.
- Keep the root `AGENTS.md` and `CLAUDE.md` aligned on branch/worktree
  expectations so Claude's cold-start path does not diverge from Codex's.
- Add a lightweight search-hygiene note in root guidance telling agents to
  ignore `.claude/` worktree snapshots when searching for authoritative
  `AGENTS.md` files.

Acceptance:
- Root `AGENTS.md` clearly states that `AGENTS.md` / `CLAUDE.md` files are
  paired and that `AGENTS.md` remains the authoritative source.
- The plan explicitly treats the expected local `CLAUDE.md` body as the minimal
  `@AGENTS.md` forwarder pattern, not a second long-form guidance file.
- A cold-start Claude session can discover root workflow rules by reading
  `CLAUDE.md` alone and following it into `AGENTS.md`.
- Root guidance no longer points to the old top-level `skills/` convention as
  the intended steady-state home for repo-local Codex skills.
- Root guidance includes explicit heuristics for when agents should self-approve
  work instead of asking the user mid-execution.
- The docs do not suggest that stale `.claude/worktrees/` copies are
  authoritative.

### U2: Documentation model definition and active-doc surface reorganization

Files:
- `AGENTS.md`
- `README.md` (root, if missing or insufficient)
- `docs/README.md`
- `docs/reference/`
- `docs/runbooks/`
- `docs/work/`
- `docs/work/work-status.json`
- `docs/archive/`

Changes:
- Document the new repo-wide documentation model in root guidance:
  - `README.md` is canonical for repo and folder semantics and enduring
    product/repo principles
  - `docs/reference/` is for evergreen behavior and policy docs
  - `docs/runbooks/` is for repeatable operational procedures
  - `docs/work/` is for in-flight initiative docs, one doc per initiative
  - `docs/archive/` is for completed or superseded historical docs
  - `.agents/skills/` is for repo-local Codex skills
- Define the expected `docs/work/` management contract:
  - small one-off work may use a single initiative doc
  - larger initiatives should use a dedicated folder under `docs/work/`
  - staged initiatives are linear for now and should be modeled as a sequence
    of stage docs inside that folder
  - stage docs should use names like `S1-<name>.md`, `S2-<name>.md`, and so on
  - do not split one initiative into separate spec-vs-plan docs
  - maintain a master `docs/work/work-status.json` index referenced by a
    README, but keep it initiative-level only
  - each staged initiative folder must also contain its own
    `work-status.json` that tracks the status of the stages in that folder
  - each active initiative doc or stage doc must carry a top-of-file status
    indicator
  - allowed active statuses are `draft`, `plan`, and `in progress`
  - each active initiative doc or stage doc must include in-document progress
    tracking that agents keep current as work advances
- Define the close-out rule for completed initiative work:
  1. keep only evergreen conclusions in `README.md` files or runbooks
  2. move the in-flight initiative doc or initiative folder to `docs/archive/`
  3. do not leave stale active planning docs in the main docs surface
- Add a root-level non-frontend task-routing table that points agents to the
  correct workspace guidance and doc areas:
  - query engine / API work -> `card_store/AGENTS.md`
  - frontend UI work -> `frontend/AGENTS.md`, `frontend/UI_ARCHITECTURE.md`
  - price pipeline work -> `price_store/AGENTS.md`
  - deck archive / ingestion work -> `deck_store/AGENTS.md`
  - significant initiative planning work -> `docs/work/`
  - release / deploy flow -> `CLAUDE.md`
- Add README expectations to root guidance: any folder with real semantic
  content should have a brief `README.md` explaining what belongs there and why.
- Replace or de-emphasize references to `plans/todo/` and `plans/executed/` as
  the primary active planning surface, since the target model moves active
  initiative docs into `docs/work/` and completed history into `docs/archive/`.

Acceptance:
- Root docs clearly state the target documentation model and which surface owns
  which kind of knowledge.
- A new worker can determine where to start reading for each major work type
  without scanning the whole repo.
- The doc model no longer leaves active planning split between `plans/` and
  `docs/` without an explicit migration target.

### U3: Planning contract for `docs/work/` initiative docs and staged initiative folders

Files:
- `AGENTS.md`
- `docs/work/README.md`
- `docs/work/work-status.json`
- active initiative docs under `docs/work/`

Changes:
- Define the required structure for in-flight initiative docs and staged
  initiative folders under `docs/work/` so they remain concrete enough for
  agent execution.
- Preserve the richer plan content requirements from the earlier draft, but
  express them against the new initiative-doc model rather than the old
  `plans/todo/` surface.
- Require each active one-off initiative doc or each active staged initiative
  doc to include:
  - status indicator at the top
  - summary
  - key changes
  - implementation units
  - test plan
  - assumptions
  - open questions when unresolved decisions remain
  - risks when material constraints exist
  - explicit progress tracking maintained during execution
- Define `work-status.json` as the machine-readable map of active initiative
  docs/folders, their statuses, and their canonical paths.
- Define the staged-initiative folder model explicitly:
  - each large initiative gets its own folder under `docs/work/`
  - each initiative folder contains a local `work-status.json`
  - each stage inside that folder gets its own status-tracked Markdown file
  - stage filenames follow the linear scheme `S1-<name>.md`, `S2-<name>.md`,
    etc.
  - for now, stages are assumed linear rather than branching
- Define status ownership clearly:
  - `docs/work/work-status.json` tracks initiatives only
  - `<initiative-folder>/work-status.json` tracks stage-level status inside
    that initiative
  - stage breakdowns should not appear in the top-level `docs/work` status file
- Document how an initiative doc or staged plan changes status across the
  lifecycle: `draft` -> `plan` -> `in progress` -> archived
- Make clear that once work is complete, the one-off doc or the initiative
  folder moves to `docs/archive/` rather than remaining in the active work
  surface.

Acceptance:
- Root guidance and the `docs/work/` surface agree on what an active initiative
  doc must contain.
- The plan model is specific enough that a later worker could create or update
  either a one-off initiative doc or a staged initiative folder without
  inventing a parallel format.
- The status model is unambiguous: top-level `docs/work/work-status.json`
  tracks initiatives, while each initiative folder tracks its own stages.

### U4: Paired workspace guidance for `card_store/`, `price_store/`, and `deck_store`

Files:
- `card_store/AGENTS.md`
- `card_store/CLAUDE.md`
- `price_store/AGENTS.md`
- `price_store/CLAUDE.md`
- `deck_store/AGENTS.md`
- `deck_store/CLAUDE.md`

Changes:
- Create paired local `AGENTS.md` / `CLAUDE.md` files for each non-frontend
  workspace covered by this stage.
- Keep each workspace `CLAUDE.md` intentionally minimal, forwarding Claude to
  the local `AGENTS.md` rather than duplicating rules.
- Use the literal `@AGENTS.md` forwarding pattern for those workspace
  `CLAUDE.md` files unless a root-level exception is intentionally documented.
- Add a package-local guide for `card_store/` that covers the current schema,
  query-engine, API, import, and pack-generation routing using real file paths.
- Add a package-local guide for the price pipeline that matches the current
  workspace structure and storage model.
- Document the live storage boundary correctly:
  - mutable raw capture data lives under the repo-local `.price_data/` area,
    not under `price_store/data/raw/`
  - raw source payloads are treated as durable source snapshots and should not
    be hand-edited
  - canonical, published, and hosted layers have distinct responsibilities
- Document current workflow boundaries and routing:
  - source-specific behavior -> `src/sources/justtcg/README.md`,
    `src/sources/justtcg/analysis.md`,
    `src/sources/tcgplayer/README.md`,
    `src/sources/tcgplayer/analysis.md`
  - canonical repository and schemas -> `src/canonical/`
  - published artifact contracts -> `src/published/`
  - hosted / D1 pipeline logic -> `src/hosted/`, `migrations/d1/`
  - local environment and bootstrap -> `src/local-env.ts`, `src/bootstrap.ts`
  - executed historical context -> `docs/archive/work/price-store/`
- Add test expectations that point to the existing `price_store/test/` suite,
  including `bootstrap.test.ts` and source-specific coverage.
- Add an explicit note that source README and analysis files are part of the
  authoritative working context for price-source changes.
- Add a package-local guide for `deck_store/` that reflects the implemented
  archive/audit/source-intake workspace and routes to its current docs and code.

Acceptance:
- Each covered workspace has a local `AGENTS.md` and a paired local
  `CLAUDE.md`.
- Each local `CLAUDE.md` is clearly subordinate to the local `AGENTS.md`
  instead of becoming a second full guidance surface.
- The expected workspace `CLAUDE.md` form is unambiguous enough that future
  folders can copy the same `@AGENTS.md` convention consistently.
- The `card_store/`, `price_store/`, and `deck_store/` guides reference only
  files and concepts that exist in the current repo.
- The new guide fixes the discoverability gap identified in the audit for the
  `price_store/src/sources/*/README.md` and `analysis.md` files.
- The workspace guidance reflects the real `.price_data/` storage model and the
  current hosted/published pipeline layout.

### U5: README coverage and doc-location normalization

Files:
- root `README.md`
- folder-level `README.md` files for semantically meaningful directories as needed
- `docs/README.md`
- existing docs currently sitting directly under `docs/`
- active historical planning docs currently under `plans/` as needed for migration notes

Changes:
- Define README expectations clearly: any folder with real semantic content
  should have a brief `README.md` explaining what belongs there and the rules
  for placing content inside it.
- Normalize the top-level `docs/` contents toward the target structure by
  identifying which current docs belong in:
  - `docs/reference/`
  - `docs/runbooks/`
  - `docs/work/`
  - `docs/archive/`
- Document the migration expectation for existing `plans/` material:
  - active initiative docs should move to `docs/work/`
  - completed or superseded historical docs should move to `docs/archive/`
  - only durable evergreen conclusions should survive in READMEs or runbooks
- Add or update `docs/README.md` so the new doc topology is discoverable from
  one place.
- Ensure the docs guidance explains when to use a single in-flight Markdown doc
  versus a dedicated initiative folder with `S1-...`, `S2-...` stage files.

Acceptance:
- The repo has one clearly documented target documentation model rather than a
  mixture of old and new placement rules.
- A later worker can tell where a new doc belongs without guessing.

## Explicit Non-Goals

- No runtime or product-behavior changes.
- No lint, formatting, CI, or test-runner changes from later stages.
- No implementation of new repo-local skills beyond establishing
  `.agents/skills/` as the intended home.
- No duplication of full guidance content between paired `AGENTS.md` and
  `CLAUDE.md` files; `CLAUDE.md` is a forwarder, not a second source of truth.
- No source-code reorganization outside the documentation surface.

## Test Plan

- Manually verify every file path referenced in the new or updated guidance
  exists in the current repo.
- Read each new workspace `AGENTS.md` against the live source tree and confirm
  the stated invariants match the current implementation.
- Confirm each paired workspace `CLAUDE.md` unambiguously routes Claude into
  the local `AGENTS.md`.
- Confirm root guidance documents the README / `docs/reference|runbooks|work|archive`
  model consistently.
- Confirm `docs/work/work-status.json` tracks only initiative-level entries.
- Confirm each staged initiative folder has its own `work-status.json` and that
  its stage statuses match the corresponding `S1-...`, `S2-...` documents.
- Confirm the root task-routing table reaches all non-frontend workspaces and
  points significant initiative work at `docs/work/`.
- No build, typecheck, or runtime verification is required for this stage
  unless a documentation claim is uncertain and needs source confirmation.

## Assumptions

- The current codebase structure under `card_store/`, `price_store/`, and
  `deck_store/` is stable enough that package-local guidance can reference it
  directly without immediately going stale.
- A minimal forwarding `CLAUDE.md` next to each `AGENTS.md` is sufficient to
  keep Claude aligned without duplicating the full guidance body.
- The repo can tolerate a documentation-surface migration away from `plans/`
  as the primary active work area, even if some historical content remains to
  be normalized over time.
- `.claude/` remains git-ignored and non-authoritative, so Stage 1 only needs
  to warn agents away from stale worktree copies rather than restructure that
  area.

## Open Questions

- How much of the current `plans/` history should be migrated during Stage 1
  versus left for a later cleanup once the new model is established?
- The initial repo-local preview skill has already been moved into
  `.agents/skills/` during this stage. Future Stage 3 work should build on
  that location rather than re-opening the directory decision.

## Risks

- The largest risk in this stage is encoding stale guidance into new
  `AGENTS.md` files. The draft already contained outdated assumptions about
  `deck_store/`, `card_store` path names, and `price_store` storage layout, so
  implementation must validate each invariant against current source before
  writing it down as repo guidance.
- The new doc model touches multiple active surfaces at once. If the migration
  is only partially applied, the repo could become more confusing for a while
  by having both old and new placement rules live at the same time.
- Paired `CLAUDE.md` files reduce cold-start drift, but they also add one more
  file per guided directory. The plan should keep those files intentionally
  tiny so the maintenance cost stays low.
- If the workspace guides become too verbose, agents may ignore them. The final
  docs should prefer tight routing tables and high-signal invariants over broad
  architecture restatements that duplicate existing READMEs.
