// queryFieldColors.ts — canonical field → display color mapping.
//
// Used by both the syntax-highlighted query bar (QueryBuilderView) and the
// query chip renderer (QuerySummaryChips) so that the color of each token in
// the raw query string and its corresponding human-readable chip always match.

/**
 * Maps a canonical field name (from card_store's fields.ts) to a hex color
 * used when displaying that field in the UI.
 */
export const FIELD_COLOR: Record<string, string> = {
  // Type identity
  cardtype:     "#7dd3fc", // sky-300
  supertype:    "#c4b5fd", // violet-300
  t:            "#5eead4", // teal-300    (typeline)
  tag:          "#86efac", // green-300

  // Collection
  domain:       "#fcd34d", // amber-300
  rarity:       "#e879f9", // fuchsia-400
  set:          "#60a5fa", // blue-400

  // Text searches
  name:         "#fb923c", // orange-400
  clean_name:   "#fb923c",
  text:         "#fdba74", // orange-300
  keyword:      "#bef264", // lime-300
  artist:       "#d1d5db", // gray-300
  flavour:      "#d1d5db",

  // Stats
  energy:       "#f9a8d4", // pink-300
  might:        "#fda4af", // rose-300
  power:        "#a5b4fc", // indigo-300
  cost:         "#67e8f9", // cyan-300

  // Finish / treatment
  is:           "#d4d4d8", // zinc-300
  finish:       "#d4d4d8",

  // Price / meta
  price:        "#34d399", // emerald-400

  // Internal / rarely displayed
  number:       "#94a3b8", // slate-400
  language:     "#94a3b8",
  layout:       "#94a3b8",
  id:           "#94a3b8",
  riftbound_id: "#94a3b8",
  tcgplayer_id: "#94a3b8",
};

/**
 * Converts a 6-digit hex color string to an rgba() CSS value.
 * Input must be in "#rrggbb" format.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
