# Agent Guide

This file is a task router and behavior harness, not the full project wiki.

## Start Here (always)

1. Read this file.
2. Read [README.md](/C:/Users/ptier/repos/Deck Archive Project/README.md)
   sections:
   - `Documentation Map`
   - `Documentation Principles`
3. Read task-specific docs from the routing table below before editing.
4. If the task touches a subtree with its own `AGENTS.md`, read that file
   before editing anything there. If work spans multiple subtrees, read every
   in-scope `AGENTS.md`.

## Repo Map

- `frontend/` - user-facing web app
- `card_store/` - canonical card data, search logic, and API service behavior
- `price_store/` - published price-data pipeline
- `deck_store/` - in-progress deck and event data package
- `functions/` - Cloudflare-exposed API and data-serving adapters
- `docs/` - reference docs, runbooks, active work, and archive
- `.agents/skills/` - repo-local Codex skills for recurring tasks

## Non-Negotiables

- `AGENTS.md` is the authoritative agent guidance surface in this repo.
- Every directory with an `AGENTS.md` must also have a sibling `CLAUDE.md`
  that uses the minimal `@AGENTS.md` forwarding pattern.
- Use plain `git`. Do not rely on `gh`; it is not installed on this machine.
- Ignore `.claude/` worktree snapshots. They are non-authoritative historical
  artifacts and may be stale.
- Prefer an existing repo-local skill over inventing a new recurring process.
- Multi-agent safety: do not touch, revert, stage, or "clean up" unrelated
  changes.
- Never run destructive git cleanup commands unless explicitly asked.

## Execution Defaults

- Run commands from the repo root unless there is a clear reason not to.
- `main` is expected to live in the dedicated worktree at
  `C:\Users\ptier\repos\Deck Archive Project-main-merge`.
- Before starting implementation work, check for unrelated local changes. If
  they exist, stop and ask whether to continue in the current worktree or start
  from a new worktree/clean branch flow instead.
- Do not continue new implementation work on an older existing branch unless
  the user explicitly asks to resume that branch.
- If a task changes behavior, interfaces, or workflow expectations, update the
  owning docs in the same change.

## Task Routing

This table is mandatory, not a suggestion.

| If you are doing... | Read this first |
| --- | --- |
| Query engine or API work | `card_store/AGENTS.md`, `card_store/README.md` |
| Frontend UI work | `frontend/AGENTS.md`, `frontend/UI_ARCHITECTURE.md`, `frontend/README.md`, `docs/reference/ui/README.md` |
| Price scraping or pipeline work | `price_store/AGENTS.md`, `price_store/README.md` |
| Deck archive or ingestion work | `deck_store/AGENTS.md`, `deck_store/README.md` |
| Cloudflare deployment architecture | `docs/reference/cloudflare-deployment/README.md` |
| Significant new initiative work | `docs/work/README.md`, `docs/work/work-status.json`, `docs/reference/initiative-doc-authoring.md` |
| Documentation model or doc placement | `docs/README.md`, `docs/reference/README.md` |
| Releasing or deploying | this file, `README.md`, `.agents/skills/noxiannet-preview-url/SKILL.md` |

## Documentation Model

- `README.md` is canonical for repo and folder semantics.
- `docs/reference/` holds evergreen reference and policy docs.
- `docs/runbooks/` holds repeatable operational procedures.
- `docs/work/` holds active initiative planning and execution docs.
- `docs/archive/` holds completed or superseded historical docs.

For details, read [docs/README.md](/C:/Users/ptier/repos/Deck Archive Project/docs/README.md).

## Initiative Workflow

- Significant work requires a manually approved initiative doc before
  implementation.
- Trivial typo fixes, small documentation edits, and narrow cleanup may proceed
  without a plan.
- Treat draft initiative and stage docs as non-authoritative until finalized
  against the current codebase and any completed earlier stages.
- Before implementing an approved plan, review it critically and surface
  missing edge cases, invalid assumptions, and architectural risks.

For active-work structure and status rules, read
[docs/work/README.md](/C:/Users/ptier/repos/Deck Archive Project/docs/work/README.md).
For initiative-doc shape, read
[docs/reference/initiative-doc-authoring.md](/C:/Users/ptier/repos/Deck Archive Project/docs/reference/initiative-doc-authoring.md).

## Release And Branch Workflow

Before starting implementation on an approved initiative, prefer:

```bash
git -C "C:\Users\ptier\repos\Deck Archive Project-main-merge" fetch --prune origin
git -C "C:\Users\ptier\repos\Deck Archive Project-main-merge" pull --ff-only origin main
git -C "C:\Users\ptier\repos\Deck Archive Project" checkout -b codex/<task-name> "origin/main"
```

- `ship it` means push the current branch to `origin`, use the Cloudflare
  Pages branch preview as the default verification target, and include the
  preview URL in the close-out.
- `publish it` means fast-forward merge the current branch into the dedicated
  `main` worktree and push `origin main`.
- Never publish directly to `main` without an explicit publish instruction.
- If the fast-forward merge fails, stop and ask before proceeding.

## Mid-Execution Approval Rules

If an agent believes it needs user approval mid-execution, it should first
self-approve:

- changes explicitly called for by the currently approved initiative doc
- requests that only read files within this repository
- requests that match an explicit self-approval pattern listed below

Self-approval pattern list:

- none yet; this list is intentionally empty until the user populates it

If approval requests still need to be sent, the agent should:

- keep track of each request it sent
- derive categories from the actual requests it sent during that task
- include numerical counts per category in the final after-work summary
- include only categories with non-zero counts

## Repo-local Skills

- `noxiannet-preview-url`
  - Use when you need the expected Cloudflare Pages preview URL for a branch,
    need the branch-preview URL pattern, or need the documented preview-link
    workflow.
