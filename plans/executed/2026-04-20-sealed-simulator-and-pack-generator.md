# Sealed Simulator And Pack Generator

## Summary

Add a Sealed Simulator UI backed by a new card-store Pack Generator domain/API. The simulator will generate six-pack sealed pools, default to a by-pack view, provide alternate pool breakdowns, support Pre-Rift seeded packs for sets with known seeded packs, support custom six-pack mixes, and let users click cards into a decklist with draggable Legend and Champion deck zones.

The generator will use existing `CardRecord` data throughout so generated pool entries, decklist cards, and dragged cards retain canonical card metadata. Pack generation will use researched Riftbound booster slot assumptions and seeded Pre-Rift pack data for Spiritforged and Unleashed.

## Key Changes

- Add a `card_store/src/pack_generator/` domain layer that can:
  - Build booster packs from canonical `CardRecord[]`.
  - Accept a pack set input of `OGN`, `SFD`, or `UNL`.
  - Accept an explicit six-pack recipe for custom sealed pools.
  - Accept an optional seeded pack input for Pre-Rift style generation on `SFD` and `UNL`.
  - Return generated pool cards as `CardRecord`-backed entries with pack, slot, finish, and source metadata.
  - Enforce no duplicate tournament-playable card identity inside one generated booster, while still allowing a foil/nonfoil treatment distinction only where that is intentionally modeled.
- Add static seeded-pack data for known Spiritforged and Unleashed Pre-Rift mini-precons:
  - Ezreal, Irelia, Jax, Lucian, Rek'Sai, Renata Glasc.
  - Ivern, Master Yi, Jhin, Kha'Zix, Diana, Vi.
  - Store them as set/collector references, resolving to `CardRecord`s at generation time so the source data stays compact and validation catches missing cards.
- Add a backend API surface, likely:
  - `GET /api/pack-generator/options` for available sets, formats, and seeded packs.
  - `POST /api/pack-generator/pools` with `{ format, setId?, packs?, seededPackId? }`.
  - Standard sealed generates six normal boosters from the selected set, including Origins.
  - Choose My Packs generates six normal boosters from an explicit set recipe, for example `["OGN", "OGN", "SFD", "SFD", "UNL", "UNL"]`.
  - Pre-Rift generates one random or selected seeded pack plus five normal boosters for `SFD` or `UNL`.
- Add a top-level frontend project/view selector so the current Card Search remains available and Pack Generator/Sealed Simulator becomes a selectable project.
- Build the Sealed Simulator screen with:
  - A top control area containing settings and `New Pool`.
  - Settings for Standard sealed, Pre-Rift sealed, and Choose My Packs.
  - Standard set options for Origins, Spiritforged, and Unleashed.
  - Pre-Rift set options for Spiritforged and Unleashed only.
  - A seeded-pack dropdown with available seeded packs for the chosen Pre-Rift set, plus a random option.
  - A compact Choose My Packs button/menu that opens a six-slot pack picker instead of permanently bloating the base UI.
  - A decklist block between the controls/filter rows and the pool display.
  - Dedicated Legend and Champion zones that accept dragged eligible cards from the decklist.
  - A pool-view selector defaulting to Packs.
- Implement pool views:
  - Packs: six scrollable pack windows, preserving generated pack membership.
  - Domain: six blocks, one per domain.
  - Champions & Legends: one Champion Unit block and one Legend block.
  - Units, Spells, Gear: each grouped into six domain blocks.
- Implement block/card layout rules:
  - Sort columns by ascending energy cost, with no-cost cards placed consistently after or before numbered energy after checking existing data behavior.
  - Stack copies of the same tournament-playable card tightly.
  - Offset distinct cards in the same column enough that the next card name remains fully visible, roughly just over half a card image height.
  - Use the existing legal identity behavior (`riftbound_id` first, then clean-name fallback) for copy grouping.
- Update frontend tests for:
  - Mode/project switching.
  - Pool generation API calls.
  - Choose My Packs menu opening and six-pack recipe submission.
  - Default Packs view.
  - View selector behavior.
  - Click-to-decklist and Legend/Champion zone assignment.
- Update card-store tests for:
  - Pack slot counts.
  - Set filtering.
  - Custom six-pack recipes.
  - No duplicate legal identity inside a generated booster.
  - Seeded pack resolution.
  - Pre-Rift pool composition.

## Researched Pack Assumptions

- Official Origins booster composition is 7 common slots, 3 uncommon slots, 2 rare-or-better slots, 1 foil slot, 1 token/rune slot, plus insert.
- Epics appear in about 1 out of every 4 boosters and replace a rare slot; two epics in one booster are possible.
- Rare and Epic cards are foil by default.
- The dedicated foil slot is usually common or uncommon, but can upgrade to rare or epic. Public sources found did not provide exact foil-slot upgrade rates, so implementation will use a documented good-faith configurable default.
- Origins and Spiritforged had a known production issue where a small percentage of individual packs could miss a rare, but booster boxes still had the correct rare distribution. The simulator will model intended pack contents rather than the manufacturing issue.
- Public sources found did not expose detailed pack collation beyond the slot/rarity structure, so each card within a slot's eligible rarity pool will be equally likely after duplicate-exclusion filtering.

## Seeded-Pack Research Notes

- Spiritforged Pre-Rift sources describe a 15-card seeded Legend pack plus five Spiritforged boosters and a Yone promo. The six seeded Legend packs are Ezreal, Irelia, Jax, Lucian, Rek'Sai, and Renata Glasc.
- RiftMana publishes full Spiritforged seeded mini-precon decklists by set/collector number; these should be the initial exact seeded-pack backfill.
- Unleashed Pre-Rift sources describe the same 15-card seeded mini-precon plus five booster structure. The six seeded Legend packs are Ivern, Master Yi, Jhin, Kha'Zix, Diana, and Vi.
- RiftMana publishes full Unleashed seeded mini-precon decklists by set/collector number; these should be the initial exact seeded-pack backfill.
- Origins will be supported only as standard booster sealed and as a selectable pack source in Choose My Packs. It will not expose Pre-Rift seeded packs.

## Source References

- Official Origins booster composition, epic behavior, foil slot, and overnumber legality notes: https://riftbound.leagueoflegends.com/en-us/news/announcements/collectability-in-riftbound-origins/
- Official Origins/Spiritforged rare-slot manufacturing note: https://riftbound.leagueoflegends.com/en-us/news/announcements/riftbound-origins-launch-learnings/
- Official organized-play note that Origins used release events and later sets use prerelease events: https://riftbound.leagueoflegends.com/en-us/news/organizedplay/riftbound-organized-play/
- Spiritforged Pre-Rift kit structure and six seeded Legend options: https://gametyrant.com/news/riftbound-spiritforged-pre-rift-guide
- Spiritforged seeded mini-precon card lists: https://riftmana.com/spiritforged-pre-rift-event-rules-6-mini-pre-constructed-decks/
- Unleashed seeded mini-precon card lists: https://riftmana.com/unleashed-pre-rift-event-rules-6-mini-pre-constructed-decks/
- Origins release event examples describing Champion Deck plus two boosters plus promo pack: https://www.magicstronghold.com/store/item/421302 and https://emmettstoystop.com/products/riftbound-release-event

## Test Plan

- Run `npm.cmd test -w @noxiannet/card-store`.
- Run `npm.cmd test -w @noxiannet/frontend`.
- Run `npm.cmd run build -w @noxiannet/card-store`.
- Run `npm.cmd run build -w @noxiannet/frontend`.
- Manually run the API and web app, generate Standard and Pre-Rift pools, and verify:
  - New Pool regenerates all six pool windows.
  - Origins Standard sealed works.
  - Spiritforged and Unleashed Pre-Rift sealed work with random and selected seeded packs.
  - Choose My Packs opens from a compact control, submits exactly six pack choices, and generates mixed-set pools.
  - Packs is the default pool view.
  - Domain, Champions & Legends, Units, Spells, and Gear views regroup the same pool without losing cards.
  - Card clicks add decklist entries.
  - Legend and Champion zones accept only appropriate card types.
  - Duplicate cards stack visibly while distinct cards leave card names readable.
  - Mobile and desktop layouts remain scrollable without incoherent overlap.

## Assumptions

- The generator should use the existing local canonical JSON data and query/search helpers rather than calling external services at runtime.
- `riftbound_id` is the best available tournament-playable identity for duplicate prevention and copy stacking.
- Booster token/rune slot should resolve to available token/rune-like records when present; otherwise the generator may return a lightweight slot descriptor with no `CardRecord` until token modeling is improved.
- Showcase, alternate-art, overnumbered, and signed cards should be excluded from normal gameplay booster slots unless the foil/special slot rules explicitly include them.
- "Standard sealed" means six normal boosters from the selected set.
- "Choose My Packs" means exactly six normal boosters selected from currently available pack sets: Origins, Spiritforged, and Unleashed.
- "Pre-Rift sealed" means one seeded pack plus five normal boosters for Spiritforged or Unleashed.
- Spiritforged and Unleashed seeded pack sizes should follow the public 15-card sources, even though a normal booster has 14 cards.
- Origins has no seeded Pre-Rift option in this implementation.

## Follow-Up Amendment: UNL Ashe Promo And Multicolor Grouping

- Add `Ashe - Focused` to every Unleashed Pre-Rift sealed pool as an extra seeded-style card resolved from canonical card data.
- Keep the existing six-pack pool structure by appending Ashe to the generated seeded pack instead of introducing a new pack type.
- Update grouped sealed-pool views so cards with more than one domain render in a dedicated `Multicolor` block instead of being assigned to the first matching single-domain section.
- Apply the `Multicolor` grouping consistently to Domain, Units, Spells, and Gear views, while retaining `Other` for domainless cards.
- Add or update tests for:
  - Unleashed Pre-Rift pools always including `Ashe - Focused`
  - non-Unleashed Pre-Rift pools not receiving the Ashe bonus card
  - grouped sealed views rendering multi-domain cards under `Multicolor`

## Follow-Up Amendment: Minimum Domain Floor

- Before returning a generated sealed pool, validate the six primary domains across the full displayed pool.
- If any primary domain has 9 or fewer cards in the generated pool, discard that pool and regenerate until the floor is satisfied.
- Count cards toward every primary domain they list, so multicolor cards help each included domain's total.
- Exclude non-primary values such as `Colorless` from the retry floor check.
- Bound retries with a generator-side attempt cap and return a clear error if no valid pool is found within that limit.
- Add or update tests for:
  - retrying after an invalid low-domain pool and returning the first valid regenerated pool
  - throwing a `PackGenerationError` when the retry cap is exhausted
