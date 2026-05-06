# Tools Dropdown And Deploy Cleanup

## Summary

Clean up the temporary Cloudflare deployment-diagnostic files that are no longer
part of the intended deploy shape, and update the top navigation so `Tools`
appears as a single peer destination next to `Deck Explorer` that expands into
a click-open menu for `Tier List` and `Sealed Pools`.

## Key Changes

- Remove temporary deployment-diagnostic files that should not remain in the
  repo long-term:
  - `wrangler.toml.off`
  - `frontend/public/_redirects.off`
  - `frontend/public/_routes.json.off`
- Preserve the currently working deploy path while removing only files that are
  now confirmed unnecessary.
- Refactor the app header navigation so:
  - `Cards`
  - `Deck Explorer`
  - `Tools`
  render as peer primary nav items
- Replace the always-visible tools sub-nav with a click-open dropdown or menu
  anchored to `Tools`.
- Keep `Tier List` and `Sealed Pools` reachable from the dropdown and visually
  indicate the active tool route when one is selected.
- Preserve existing route paths and app behavior:
  - `/tools/tier-list`
  - `/tools/sealed-pools`
- Update tests for the new navigation interaction and for the repo cleanup
  where relevant.

## Test Plan

- Run `npm test`.
- Run `npm run build`.
- Manually verify:
  - the app header shows `Tools` as a primary nav item beside `Deck Explorer`
  - clicking `Tools` opens the menu
  - `Tier List` and `Sealed Pools` routes open from the menu
  - the active tool route remains visually obvious after navigation
  - the menu interaction works on desktop and mobile widths
  - the site still deploys from the current working Cloudflare setup

## Assumptions

- The temporary `.off` files are diagnostic leftovers and should be removed
  rather than restored.
- The current working Cloudflare deployment path should remain based on the
  state that succeeded during diagnosis, so this cleanup should avoid
  reintroducing the previously failing `_routes.json` setup.
- A click-open dropdown is the intended `Tools` interaction, rather than a
  hover-only menu.
