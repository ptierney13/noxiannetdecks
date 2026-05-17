# Stage 2: ESLint, Prettier, and GitHub Actions CI

> **DRAFT** — This plan must be finalized and approved before implementation
> begins. When Stage 2 is complete, update Stage 3–4 draft plans with any
> newly relevant decisions or changed assumptions.

## Summary

Add a linting and formatting baseline (ESLint + Prettier) across all
workspaces, then wire them into a GitHub Actions CI workflow that gates every
push on format check, lint, typecheck, and build. This stage creates the
automated backstop that catches AI-introduced errors before they reach `main`.

The expected sequence: install tooling → configure rules → fix existing
violations → add CI workflow → verify green.

## Key Changes

### U1: Root ESLint flat config

Install and configure ESLint with TypeScript support at the repo root.

**Files:** `eslint.config.js` (root), `package.json` (root devDependencies)

**Packages to install (root devDependencies):**
- `eslint`
- `typescript-eslint`
- `eslint-config-prettier` (disables ESLint rules that conflict with Prettier)

**Config strategy:** Use ESLint flat config (`eslint.config.js`). The root
config applies to all workspaces via glob patterns. Each workspace can extend
or override via its own `eslint.config.js` if workspace-specific rules are
needed, but start with a single root config.

**Rule set (minimal, strict-compatible):**
- Enable `typescript-eslint/recommended` as the base.
- Disable rules known to conflict with the existing codebase style (determine
  during implementation by running ESLint and reviewing violations).
- Apply `eslint-config-prettier` last to zero out formatting conflicts.
- Extend with `no-console` warning for all workspaces except scripts.

**Acceptance:** `npx eslint .` runs to completion (violations may exist at
this point — fix them in U3).

### U2: Prettier config

Install Prettier and add a shared config.

**Files:** `.prettierrc.json` (root), `.prettierignore` (root),
`package.json` (root devDependencies)

**Packages:** `prettier`

**Config:**
```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

Adjust `printWidth` and quote style after running `prettier --check .` and
reviewing diffs — the goal is minimal reformatting of existing code. The
specific values above are defaults; the finalized plan should confirm these
against the existing codebase style.

**`.prettierignore`:** Exclude `plans/`, `*.md`, `card_store/data/cards.json`,
`dist/`, `.cloudflare/`.

**Acceptance:** `npx prettier --check .` runs to completion.

### U3: Add lint and format scripts to root and workspaces

**Files:** `package.json` (root), `card_store/package.json`,
`price_store/package.json`, `frontend/package.json`

**Root scripts to add:**
```json
"lint": "eslint .",
"lint:fix": "eslint . --fix",
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "npm run typecheck -w @noxiannet/card-store && npm run typecheck -w @noxiannet/frontend"
```

**Per-workspace scripts to add:**
```json
"lint": "eslint .",
"typecheck": "tsc --noEmit"
```

Note: `card_store` builds via `tsc -p tsconfig.json` which emits output. The
`typecheck` script should use `tsc --noEmit` to avoid emitting during CI.

**Acceptance:** `npm run lint`, `npm run format:check`, and `npm run typecheck`
all exit 0 after violations are fixed in U4.

### U4: Fix existing ESLint and Prettier violations

Run `npm run lint` and `npm run format:check` after U1–U3 are in place.
Categorize violations:

- **Auto-fixable:** run `npm run lint:fix` and `npm run format` to resolve.
- **Manual violations:** review each; common expected issues are:
  - `@typescript-eslint/no-explicit-any` — assess each occurrence; either
    add a type or suppress with a justified comment.
  - `@typescript-eslint/no-unused-vars` — remove or prefix with `_`.
  - Import ordering if eslint-plugin-import is added.

**Do not suppress violations with blanket `/* eslint-disable */`** unless
they are genuinely false positives. Prefer fixing the code or narrowing the
rule.

**Acceptance:** `npm run lint` and `npm run format:check` exit 0.

### U5: GitHub Actions CI workflow

**File:** `.github/workflows/validate.yml`

**Trigger:** push to any branch, pull_request targeting `main`.

**Jobs (run in parallel where possible):**

```yaml
jobs:
  format-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run format:check

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck

  build:
    runs-on: ubuntu-latest
    needs: [typecheck]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run build
```

Note: The `build` job depends on `typecheck` to avoid wasting build minutes on
a type-broken workspace. `format-check` and `lint` are independent.

**Environment variables:** The build for `price_store` and `frontend` may
require env vars (e.g., D1 bindings, API URL). If so, add placeholder secrets
or skip affected workspaces in the build job with `--if-present`.

**Acceptance:** All four jobs pass on a clean branch after U4.

### U6: Update CLAUDE.md and root AGENTS.md

Document the new scripts and CI in the relevant guidance files.

**CLAUDE.md additions:**
- Add `npm run lint` and `npm run format:check` to the Commands section.
- Add a note that CI runs on every push; a green CI is expected before merging.

**Root AGENTS.md additions:**
- Note that lint and format must pass before shipping a branch.
- Point to `.github/workflows/validate.yml` as the canonical CI definition.

## Test Plan

- `npm run lint` exits 0 on the branch before merging.
- `npm run format:check` exits 0.
- `npm run typecheck` exits 0.
- `npm run build` exits 0.
- Push the branch to `origin` and confirm the GitHub Actions workflow appears
  and all jobs pass.
- Run `npm test` to confirm existing tests still pass (ESLint config should not
  break test files).

## Assumptions

- The existing TypeScript code will have a nonzero number of lint violations;
  the implementation worker should budget time for U4 cleanup.
- The repo root `package.json` is compatible with adding devDependencies that
  apply across workspaces via npm workspaces hoisting.
- GitHub Actions free tier is sufficient for the workflow cadence expected on
  this repo.
- `card_store` uses `NodeNext` module resolution; ESLint must be configured to
  handle `.ts` extensions with the TypeScript plugin parser set correctly.
- The build job may need to skip `price_store` or `deck_store` if those
  workspaces have intentional build stubs that fail (confirm during
  implementation).

## Open Questions

- Does `price_store` currently build cleanly? If not, should the CI build job
  skip it for now or fix it?
- Should `no-console` be a warning or an error in production source files?
  (Scripts and test files should be exempt either way.)
- Is there a `.node-version` or `.nvmrc` that should inform the CI Node
  version? (Currently no toolchain manager is configured at root.)
