import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";
import { router } from "./src/app/router";

// Reset the singleton TanStack Router between tests to prevent stale-state
// contamination.
//
// Two steps are needed:
//
// 1. Navigate to a clean route.  This updates window.location, the history
//    store, and (via router.load()) the active match stores.
//
// 2. Explicitly sync resolvedLocation.  router.navigate() calls router.load()
//    synchronously (no Transitioner is mounted between tests), which updates
//    stores.matches but NOT stores.resolvedLocation.  resolvedLocation is only
//    set by the Transitioner's useLayoutEffect while a RouterProvider is
//    rendered.  Without a direct set here, resolvedLocation keeps the previous
//    test's value — causing the next test's initial render to show a stale
//    route with stale search params.
//
// We reset to "/" (HomeRoute / IndexRoute) because:
//  • ALL routes — including HomeRoute — are now wrapped in PageShell, so every
//    route-to-route transition reuses the same outer DOM structure.  This
//    prevents a concurrent-mode DOM-detachment bug that occurred when
//    transitioning FROM a route without PageShell TO one with it.
//  • The home page hero's <input type="text"> (role="textbox") is available
//    synchronously after render(), satisfying tests that call getByRole without
//    awaiting.
beforeEach(async () => {
  await router.navigate({ to: "/" });
  // Sync resolvedLocation to match the just-loaded location so the next
  // render's initial RouterProvider output is clean, not stale.
  router.stores.resolvedLocation.set(router.stores.location.get());
});
