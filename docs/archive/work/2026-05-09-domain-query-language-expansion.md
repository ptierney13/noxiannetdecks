# Domain Query Language Expansion

## Summary

Expand `domain` query handling so users can search by explicit color words and stable color substrings, and add set-comparison operators for parsed domain queries.

This plan is approved for implementation.

## Key changes

- Add explicit color-word aliases for domain queries:
  - `red` -> `Fury`
  - `green` -> `Calm`
  - `blue` -> `Mind`
  - `orange` -> `Body`
  - `purple` -> `Chaos`
  - `yellow` -> `Order`
- Add stable shorthand aliases for those color words where they are unlikely to collide with expected freeform text search, such as:
  - `purp` -> `Chaos`
  - `oran` -> `Body`
  - `yell` -> `Order`
  - `gree` -> `Calm`
  - `blu` -> `Mind`
  - `red` -> `Fury`
- Centralize domain-token parsing so `domain` queries can recognize:
  - canonical domain names like `body`
  - existing letter codes like `b`, `mf`, `pu`
  - approved color aliases like `purple`
- Extend `domain` predicate evaluation to support set-style comparison operators for parsed domain sets:
  - `=` exact set equality
  - `>` strict superset
  - `>=` superset-or-equal
  - `<` strict subset
  - `<=` subset-or-equal
- Treat parsed `domain:` queries uniformly as subset-or-equal searches, making inputs like `d:xy` equivalent to `d<=xy` without a separate two-domain-only rule.
- Preserve ordinary string matching for `domain` values that do not parse as one of the recognized domain tokens above.
- Update helper text so the user-visible query language explains that parsed `domain:` queries use subset-or-equal semantics rather than plain text contains matching.
- Update query-language helper docs and UI guidance to explain:
  - color aliases
  - set-comparison semantics
  - the uniform parsed-domain `:` shorthand behavior

## Test plan

- Add parser tests that confirm `domain` accepts comparison operators when the value is a recognized domain token or domain-code string.
- Add evaluator tests for explicit color aliases like `d:purple`, `d:purp`, and `d:yellow`.
- Add evaluator tests for domain-set operators:
  - `d=p`
  - `d>p`
  - `d>=p`
  - `d<pu`
  - `d<=pu`
- Add tests for hybrid cards and mono-domain cards to verify exact, subset, and superset distinctions.
- Add tests for parsed-domain colon shorthand behavior:
  - cases where `d:xy` returns mono-domain `x` or `y` cards
  - cases where `d:xy` also returns exact `x+y` multi-domain cards
- Add tests covering non-domain strings so ordinary `domain:<text>` contains matching still works when the value is not a recognized token.
- Run the card-store test suite and any affected frontend tests/documentation checks.

## Assumptions

- The frontend domain colors in `frontend/src/QueryBuilderView.tsx` are the intended source of truth for the color-to-domain vocabulary.
- Explicit color aliases should be fixed and curated, not arbitrary prefixes, to avoid accidental collisions and unstable behavior.
- Parsed `domain:` queries intentionally use subset-or-equal semantics, with `d:xy` treated as `d<=xy`.
- Query normalization or helper copy can be extended enough to make the shorthand behavior understandable to users if needed.
