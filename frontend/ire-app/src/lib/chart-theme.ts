/** Fixed chart palette so recharts SVG matches the ledger tokens exactly. */
export const CHART = {
  forest: "#2F6B4F",
  forestFaded: "rgba(47, 107, 79, 0.34)",
  oxide: "#A6501F",
  oxideFaded: "rgba(166, 80, 31, 0.34)",
  brass: "#8A6B12",
  ink: "#20261F",
  muted: "#5A6354",
  faint: "#6E6A5C",
  line: "#DBD6C4",
  surface: "#FBFAF4",
  cursor: "rgba(32, 38, 31, 0.05)",
} as const;

export const MONO_STACK = "'IBM Plex Mono', ui-monospace, monospace";

export const AXIS_TICK = {
  fontSize: 11,
  fill: CHART.muted,
  fontFamily: MONO_STACK,
} as const;
