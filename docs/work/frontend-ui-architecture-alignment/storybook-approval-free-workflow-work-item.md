# Work Item: Storybook Approval-Free Workflow

> Status: proposed

## Summary

Make Storybook verification approval-free and agent-friendly for frontend UI
work. Future agents should be able to build Storybook, run Storybook checks, and
open a component story for browser smoke testing without asking the user to
approve local server startup, temporary log cleanup, or ad hoc background
process commands.

This work item belongs to the frontend UI architecture alignment initiative
because Storybook-first review is a hard requirement for component and page
rewrite work. The current workflow has enough friction that agents can complete
the component work but still need approvals just to inspect the Storybook result.

## Problem

Storybook is supposed to be the low-risk, repeatable UI verification surface.
On the 2026-05-21 search-results-pane run, the component implementation was
ready for Storybook inspection, but serving the built Storybook output inside
the current sandbox was unreliable. The agent had to request approval to start a
local static server outside the sandbox even though the verification target was
only `frontend/storybook-static`.

That should not happen. Storybook verification should be ordinary local
workspace work, not an approval-producing workflow.

## Incident Details From 2026-05-21

The search-results-pane run needed Storybook because the work introduced and
reviewed frontend component surfaces:

- `CardSearchResultsPane`
- `CardSummaryPopup`
- `ModalShell`
- related card result and popup subcomponents

The run completed these verification steps:

- `npm.cmd run build -w @noxiannet/frontend` passed.
- `npm.cmd run build-storybook -w @noxiannet/frontend` passed.
- `npm.cmd run test -w @noxiannet/frontend` failed on existing/stale frontend
  tests unrelated to the new search-results pane.
- `npm.cmd run test:storybook -w @noxiannet/frontend` failed because the
  configured include points at a removed
  `src/storybook/design-system.stories.test.tsx` file.

Manual Storybook browser inspection still needed a local server for the Browser
skill. Several approval-free attempts were tried first:

- Running the frontend dev server in the foreground showed Vite was ready but
  the command timed out and the process was killed because it was not a
  durable background workflow for agent verification.
- Multiple hidden/background `Start-Process` attempts for `npm.cmd`,
  `cmd.exe`, `powershell.exe`, direct Vite, and Python static serving either
  exited, failed to bind, or were unreachable from the browser verification
  step.
- Direct Vite invocation from `frontend/` hit sandbox access errors such as
  `Cannot read directory "../../..": Access is denied` and failure to resolve
  `frontend/vite.config.ts`.
- A Node `createServer` attempt also hit sandbox access errors while walking
  parent directories.
- A Python `http.server` attempt inside the sandbox was unreachable.

After those failures, approval was requested to run this static server outside
the sandbox:

```powershell
$out = Join-Path (Get-Location) '_tmp_storybook_http.out.log'
$err = Join-Path (Get-Location) '_tmp_storybook_http.err.log'
Remove-Item -LiteralPath $out,$err -ErrorAction SilentlyContinue
$p = Start-Process -WindowStyle Hidden -FilePath 'python' -ArgumentList '-m','http.server','6123','--bind','127.0.0.1','--directory','frontend\storybook-static' -WorkingDirectory 'C:\Users\ptier\repos\Deck Archive Project' -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
$p.Id
```

Approval was needed because the agent could not reliably keep a local
Storybook/static server alive and reachable from inside the sandbox. The server
itself only served built workspace files on `127.0.0.1`, but the specific
background process shape required escalation.

The approved server was used to inspect:

```text
http://127.0.0.1:6123/iframe.html?id=features-cardsearchresultspane--default&viewMode=story
```

The browser smoke verified that the result summary rendered, the repeated card
button was present, clicking `Open Jinx, Loose Cannon` opened exactly one
dialog, and the rebuilt Storybook still rendered the story successfully.

Approval requests reported for that run:

- Static Storybook server outside sandbox: 2 requests.
- Temporary Storybook log cleanup: 1 request.

The temporary cleanup request should also be eliminated. Generated logs should
live under an ignored workspace path with a documented cleanup strategy that
does not require escalation.

## Desired Future State

Storybook verification should have a single canonical workflow for agents:

- Build Storybook with the existing workspace command.
- Serve Storybook from a documented workspace-safe script or command.
- Run any required Storybook smoke checks without user approval.
- Shut down the server cleanly.
- Leave logs in a known ignored workspace location, or clean them up without
  escalation.

The expected approval count for Storybook verification is zero.

## Key Changes

### 1. Audit the current Storybook scripts and config

Review the current frontend Storybook setup before changing behavior:

- `frontend/package.json`
- `frontend/.storybook/`
- `frontend/vitest.storybook.config.ts`
- existing component stories
- the repo-local `run-storybook` skill
- frontend guidance in `frontend/AGENTS.md` and `frontend/UI_ARCHITECTURE.md`

Document which command is canonical for each use case:

- local interactive Storybook
- static Storybook build
- static Storybook serve
- Storybook test/smoke verification

### 2. Fix `test:storybook` so it is meaningful

`npm run test:storybook -w @noxiannet/frontend` currently fails because it
targets a removed story test file. Make the command either:

- run the current intended Storybook tests, or
- intentionally no-op with a clear message if this repository is not ready for
  automated Storybook tests yet.

The command should not fail because of stale configuration.

### 3. Add an approval-free static Storybook serve path

Add a repeatable command or script that serves `frontend/storybook-static` on a
local loopback port without requiring ad hoc `Start-Process` escalation.

The script should:

- bind to `127.0.0.1`
- use a documented default port
- fail clearly if Storybook has not been built
- write logs under an ignored workspace path if logs are needed
- cleanly stop when the smoke command exits
- avoid requiring user approval for ordinary component verification

Possible shape:

```text
npm run storybook:serve-static -w @noxiannet/frontend
npm run storybook:smoke -w @noxiannet/frontend -- features-cardsearchresultspane--default
```

The exact script names can change during implementation, but the final workflow
must be explicit and documented.

### 4. Add an agent-friendly Storybook smoke workflow

Create a small smoke harness for component stories that can verify a story URL
loads and optional selectors/interactions work. It should be suitable for
component-level UI changes where full app route verification would be excessive.

The first version can be intentionally small:

- build Storybook if needed, or require a fresh build and fail with a clear
  message
- start the static server
- open the story iframe URL
- assert one or more caller-provided selectors
- optionally perform a simple click/assert interaction
- stop the server

Avoid coupling this too tightly to one component. The point is to encode the
repeatable pattern that this run had to improvise.

### 5. Update frontend agent guidance

Update the owning docs so future agents do not re-invent the workflow:

- `frontend/AGENTS.md`
- `frontend/UI_ARCHITECTURE.md`, if the guidance affects Storybook-first review
- the repo-local `run-storybook` skill, if it is the right durable home for the
  operational steps

The docs should say when to use:

- Storybook static smoke checks
- interactive Storybook review
- full app dev-server/browser checks

## Non-Goals

- Do not expand visual regression coverage broadly in this work item.
- Do not redesign the Storybook taxonomy or move all stories unless required by
  the script/config fix.
- Do not make route-level product smoke tests depend on component Storybook
  stories.
- Do not require GitHub Actions or remote infrastructure for local Storybook
  verification.

## Acceptance Criteria

- A future frontend component Storybook smoke can complete with zero user
  approvals.
- `npm run test:storybook -w @noxiannet/frontend` no longer fails because of a
  missing stale file reference.
- The canonical Storybook commands, port expectations, and cleanup behavior are
  documented for agents.
- Storybook serving does not require ad hoc background `Start-Process` commands
  in normal component-verification work.
- Temporary logs, if any, are written under a known ignored workspace path and
  do not require approval to clean up.
- Completion notes for Storybook smoke tasks can honestly report
  `approval requests: none`.

## Test Plan

Before this work item is considered complete:

- run `npm run build-storybook -w @noxiannet/frontend`
- run `npm run test:storybook -w @noxiannet/frontend`
- run the new approval-free Storybook serve or smoke command
- use the Browser skill against at least one built story URL
- confirm the server exits cleanly after smoke verification
- confirm no user approval is needed for the Storybook verification path

## Risks

- A background server script that does not terminate cleanly could leave stale
  ports occupied and make later verification flaky.
- A generic smoke harness could become too component-specific if it is designed
  around only the search-results-pane story.
- Static Storybook checks can verify component rendering, but they do not
  replace full app route checks for data-loading, routing, or API integration.

## Assumptions

- Serving built Storybook files from the workspace on `127.0.0.1` should be a
  self-contained local verification task.
- Component-level UI work should prefer Storybook smoke first, then full app
  route checks only when route behavior, data loading, or URL state changed.
- The Browser skill remains the preferred way to inspect local Storybook targets
  once the server startup path is stable.
