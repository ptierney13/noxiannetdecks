# Pages App

## Summary

The public web app is built from `frontend/` and deployed through the
`noxiannetdecks` Cloudflare Pages project.

- source: `frontend/`
- built static output: `frontend/dist`

Package-local commands and day-to-day frontend workflow belong in
[frontend/README.md](../../../frontend/README.md), not in this architecture
reference.

## Deployment Behavior

- pushes to `origin/main` trigger production deployment to
  `https://noxiannetdecks.com`
- pushes to `origin/<branch>` trigger Cloudflare preview deployments
- the expected preview URL for a branch should be determined with the
  [noxiannet-preview-url skill](../../../.agents/skills/noxiannet-preview-url/SKILL.md)

This app is served as part of the same Cloudflare-hosted surface as the public
API and published price data paths documented elsewhere in this folder.

## Update Triggers

Update this doc when:

- the frontend build source, build output, or Pages project changes
- production or preview deployment behavior changes
