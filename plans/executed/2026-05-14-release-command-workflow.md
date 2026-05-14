# Release Command Workflow

## Summary

Define a repo-level workflow for conversational release commands so completed
work consistently moves through preview and production without relying on
memory. The workflow should make `ship it` mean "push the current work branch
to origin and return the Cloudflare preview URL", make `publish it` mean
"fast-forward merge the finished branch into the dedicated `main` worktree and
push `origin main`", and make preview deployment the default close-out path for
significant feature work when the result is reasonably testable on a branch.

## Key changes

- Add a small checked-in release helper that can:
  - detect the current branch
  - push it to `origin`
  - derive the expected Cloudflare preview URL using the existing Pages config
  - optionally perform the dedicated `main` worktree fast-forward merge and push
- Add explicit repo instructions for conversational release vocabulary:
  - `ship it` or equivalent triggers branch push plus preview URL in the final
    response, with the preview URL as the last response item
  - `publish it` or equivalent triggers fast-forward merge into the dedicated
    `main` worktree plus `origin main` push
  - significant completed feature work should default to shipping to a preview
    branch when preview validation is reasonable and the user has not asked to
    stop earlier
- Update repo documentation so future workers see one canonical flow in:
  - `AGENTS.md`
  - `CLAUDE.md`
  - deployment docs if needed for discoverability
- Keep the workflow explicit about safety boundaries:
  - never auto-publish directly to `main` without an explicit publish command
  - stop and ask if fast-forward merge fails
  - preserve plan-first expectations for significant work before implementation

## Test plan

- Run the new helper in a dry or non-destructive mode for the current branch to
  confirm preview URL derivation matches `npm run preview:url`.
- Validate that branch push flow succeeds on a non-`main` branch and that the
  reported preview URL matches the branch alias convention.
- Validate that publish flow uses the dedicated
  `C:\Users\ptier\repos\Deck Archive Project-main-merge` worktree and performs
  `git merge --ff-only <branch>` followed by `git push origin main`.
- Confirm the updated instructions are easy to follow by checking that one
  future worker could determine the intended `ship` versus `publish` behavior
  from repo docs alone.

## Assumptions

- Cloudflare Pages continues to auto-deploy every branch pushed to `origin`.
- The existing branch-alias preview URL convention in
  `scripts/print-cloudflare-preview-url.mjs` remains correct.
- It is acceptable for the assistant workflow to default to preview shipping
  after significant feature completion only when the result is meaningfully
  verifiable by the user on a branch deployment.
- Git operations should remain plain `git`; `gh` will not be introduced.
