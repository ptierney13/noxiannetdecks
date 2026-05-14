---
name: noxiannet-preview-url
description: Find or derive the Cloudflare Pages preview URL for this repository's branches. Use when working in the Deck Archive Project / noxiannetdecks repo and you need the expected branch preview link, need to explain how preview aliases are formed, or need to point someone to the repo docs and script that compute preview URLs.
---

# Noxiannet Preview URL

Use the repository's documented flow instead of guessing preview links.

## Source Of Truth

- Read [CLAUDE.md](C:/Users/ptier/repos/Deck%20Archive%20Project/CLAUDE.md) for the workflow note that every branch push should auto-deploy through Cloudflare Pages.
- Read [docs/cloudflare-pages-functions.md](C:/Users/ptier/repos/Deck%20Archive%20Project/docs/cloudflare-pages-functions.md) for the preview URL rule.
- Read [scripts/print-cloudflare-preview-url.mjs](C:/Users/ptier/repos/Deck%20Archive%20Project/scripts/print-cloudflare-preview-url.mjs) and [cloudflare-pages.config.json](C:/Users/ptier/repos/Deck%20Archive%20Project/cloudflare-pages.config.json) for the exact implementation.

## Preferred Workflow

1. Confirm the branch name with `git branch --show-current`.
2. Compute the expected preview URL with `npm run preview:url -- <branch-name>`.
3. Use the returned `previewUrl` / `activeUrl` as the expected Cloudflare Pages branch URL.

## Alias Rule

The repo assumes Cloudflare branch aliases are:

- lowercased
- converted so non-alphanumeric characters become `-`
- collapsed so repeated `-` become one `-`
- trimmed so aliases do not start or end with `-`

The preview URL shape is:

```text
https://<sanitized-branch-alias>.noxiannetdecks.pages.dev
```

## Important Caveat

The script derives the expected preview URL. It does not prove the deployment is live.

If the page is missing or blank:

- say the alias rule appears correct but the deployment still needs verification
- avoid claiming the URL is live unless it has been confirmed separately
- mention that branch deploys may still be pending, failed, or disabled in Cloudflare

## Recommended Response Pattern

- Give the computed preview URL.
- Cite the repo docs and script used.
- If the user says nothing is deployed there, clarify that the script gives the expected alias, not guaranteed deployment status.
