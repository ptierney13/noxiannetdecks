# Stage 3: Repo-Local Custom Skills

> **DRAFT** — This plan must be finalized and approved before implementation
> begins. When Stage 3 is complete, update the Stage 4 draft plan with any
> newly relevant decisions or changed assumptions.

## Summary

Create a `.agents/skills/` directory with 4 initial repo-specific skills that
encode recurring AI workflows. Each skill is a SKILL.md file that a model can
invoke to run a repeatable, well-defined procedure instead of improvising it
fresh each session. The four initial skills cover the highest-frequency
recurring tasks identified from prior session history: UI preflight review,
query engine regression, plan scaffolding, and card data validation.

## Key Changes

### U1: Skill directory scaffolding

**Files:** `.agents/skills/` (directory)

Create the directory with a top-level README.md that explains the skills
convention and how to invoke a skill. Also add a pointer in the root CLAUDE.md
so agents know the directory exists.

**README.md contents:**
- What a skill is (a repeatable, invocable procedure)
- How to invoke: "Use the Skill tool with the skill name matching the folder"
- List of available skills with one-line descriptions
- How to add a new skill (copy an existing SKILL.md, name the folder)

### U2: `ui-preflight` skill

**File:** `.agents/skills/ui-preflight/SKILL.md`

A pre-ship checklist for any frontend UI change. An agent should invoke this
before marking frontend work complete. It should prompt the agent to verify:

**Checklist items:**
1. Mobile layout — does the changed component render correctly at 375px viewport
   width? (Check with browser dev tools or Playwright screenshot.)
2. Token usage — are all colors and spacing using semantic Tailwind tokens from
   the `@theme` block in `styles.css`? No raw hex values or hardcoded `px`
   values that should be tokens.
3. Storybook — does the changed component have a story, or if it's a new
   primitive, has one been added?
4. Layer compliance — is the new code in the correct layer (`ui/`, `features/`,
   `routes/`, `data/`, `lib/`) per `frontend/AGENTS.md`?
5. TanStack Router — if routing was touched, does the route tree still build
   cleanly (`npm run build -w @noxiannet/frontend`)?
6. No hardcoded route strings — all navigation uses TanStack Router `Link` or
   `navigate`, not `window.location` or raw `<a>` tags.
7. Responsive breakpoint — does the component use container queries (preferred)
   or viewport queries where container queries aren't applicable?

**Output format:** The skill should produce a pass/fail checklist as a markdown
table. Any failing item should include a one-line remediation note.

### U3: `query-regression` skill

**File:** `.agents/skills/query-regression/SKILL.md`

A verification procedure for any change to the query engine
(`card_store/src/query/`). Invoke this after any grammar, evaluator, or field
alias change.

**Procedure:**
1. Run `npm run test -w @noxiannet/card-store` and capture output.
2. Run a set of canonical query strings against the live API and verify
   expected match counts. The skill should define a minimal set of stable
   query assertions, for example:
   - `name:jinx` → at least 1 result
   - `energy>=3` → results have energy >= 3
   - `domain:body` → results all contain body domain
   - `-keyword:stealth` → no result has stealth keyword
   - `name:jin*` → wildcard matches names starting with "jin"
   - `cost:none` → results have no cost
3. If the API is not running, note that smoke tests require `npm run dev:api`.
4. Report any test failures or unexpected match-count changes.

**The skill should not modify code.** It is read-only verification only.

### U4: `plan-scaffold` skill

**File:** `.agents/skills/plan-scaffold/SKILL.md`

A skill that generates a properly formatted draft plan from a natural-language
description. Invoke this at the start of any new planning session.

**Procedure:**
1. Read `AGENTS.md` to get the current plan format requirements.
2. Read the most recent 3 plan files in `plans/executed/` to calibrate tone
   and detail level.
3. Ask the user (or use the provided description) to confirm:
   - Is this one-off work or part of a multi-stage initiative?
   - Which workspaces are affected?
   - What is the primary constraint or risk?
4. Output a complete plan draft with all required sections (Summary, Key
   Changes as Implementation Units, Open Questions, Test Plan, Assumptions,
   Risks).
5. Write the draft to the correct location:
   - One-off: `plans/todo/YYYY-MM-DD-<slug>.md`
   - Multi-stage: `plans/todo/<feature-slug>/YYYY-MM-DD-initiative.md` plus
     stage draft stubs
6. Do not ask for approval — plans are drafts until the user explicitly
   approves them.

### U5: `card-import-validate` skill

**File:** `.agents/skills/card-import-validate/SKILL.md`

A verification procedure for running the card import pipeline and validating
the output against the schema.

**Procedure:**
1. Check that `card_store/data/cards.json` exists and is non-empty.
2. Run `npm run import:riftcodex -w @noxiannet/card-store` if explicitly
   requested by the user (this hits a live external API — do not run
   automatically).
3. Run schema validation by executing the Zod parse step:
   `npx tsx -e "import('./src/data/source.ts').then(m => m.JsonFileCardSource.load())"` 
   from `card_store/` and check for validation errors.
4. Run `npm run test -w @noxiannet/card-store` to confirm the schema tests pass.
5. Report: card count before and after (if import was run), any schema
   validation errors, and test results.

**Note:** This skill must warn the user before running the import step, since
it makes external network requests.

### U6: Update root CLAUDE.md

Add a "Skills" section to CLAUDE.md that lists available skills and notes that
agents should prefer invoking a skill over improvising the same procedure. Point
to `.agents/skills/` for the full list.

## Test Plan

- Manually invoke each skill in a test session and verify the procedure
  produces useful, accurate output.
- Confirm the `ui-preflight` skill correctly identifies a known violation
  (test by introducing a raw hex color into a component, running the skill,
  and verifying it flags it).
- Confirm the `query-regression` skill catches a known regression (test by
  temporarily breaking a field alias and verifying the skill reports a failure).
- Confirm `plan-scaffold` produces a plan that matches the current format
  requirements.
- Confirm `card-import-validate` reports schema errors when given a malformed
  cards.json.

## Assumptions

- Skills are SKILL.md files that a model reads and follows as a procedure;
  they are not executable scripts. The skill author is responsible for making
  the procedure unambiguous enough that a model can follow it without
  additional guidance.
- The `query-regression` skill's canonical query assertions may need to be
  updated as card data changes; treat them as approximate sanity checks, not
  exact count assertions.
- The `card-import-validate` schema validation command may need adjustment
  depending on how `JsonFileCardSource` exposes its validation logic; the
  implementation worker should verify the exact invocation.

## Open Questions

- Should skills be usable by the Skill tool (requiring registration in
  settings) or are they plain SKILL.md files an agent reads directly? The
  manavault pattern uses Codex skills; this repo should clarify which
  invocation model applies.
- Should `query-regression` include specific card names to query, or is it
  better to use field-type assertions that don't depend on specific card data?
- Is there a fifth skill worth adding in this stage? Candidates: `price-store-health` 
  (validates price pipeline output), `responsive-audit` (mirrors manavault's
  pattern). Decision deferred to finalization.
