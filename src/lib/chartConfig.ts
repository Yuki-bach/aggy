/** Chart.js setup and registration (tree-shaken) */

import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export { Chart };

/** Color palette for survey aggregation (light/dark compatible) */
const DEFAULT_PALETTE = [
  "#0064d4",
  "#0097a7",
  "#e06500",
  "#1b7d3a",
  "#c62828",
  "#6a1b9a",
  "#00838f",
  "#ef6c00",
  "#4527a0",
  "#00695c",
];

export type PaletteId = "default" | "blue" | "green" | "orange" | "red" | "purple";

/** ColorBrewer sequential single-hue 9-step palettes (dark → light) */
const COLORBREWER_PALETTES: Record<Exclude<PaletteId, "default">, string[]> = {
  blue: [
    "#08306b",
    "#08519c",
    "#2171b5",
    "#4292c6",
    "#6baed6",
    "#9ecae1",
    "#c6dbef",
    "#deebf7",
    "#f7fbff",
  ],
  green: [
    "#00441b",
    "#006d2c",
    "#238b45",
    "#41ab5d",
    "#74c476",
    "#a1d99b",
    "#c7e9c0",
    "#e5f5e0",
    "#f7fcf5",
  ],
  orange: [
    "#7f2704",
    "#a63603",
    "#d94801",
    "#f16913",
    "#fd8d3c",
    "#fdae6b",
    "#fdd0a2",
    "#fee6ce",
    "#fff5eb",
  ],
  red: [
    "#67000d",
    "#a50f15",
    "#cb181d",
    "#ef3b2c",
    "#fb6a4a",
    "#fc9272",
    "#fcbba1",
    "#fee0d2",
    "#fff5f0",
  ],
  purple: [
    "#3f007d",
    "#54278f",
    "#6a51a3",
    "#807dba",
    "#9e9ac8",
    "#bcbddc",
    "#dadaeb",
    "#efedf5",
    "#fcfbfd",
  ],
};

/** Representative base color for each palette (used for UI swatch) */
const PALETTE_BASES: Record<Exclude<PaletteId, "default">, string> = {
  blue: "#2171b5",
  green: "#238b45",
  orange: "#d94801",
  red: "#cb181d",
  purple: "#6a51a3",
};

const PALETTE_IDS: PaletteId[] = ["default", "red", "orange", "green", "blue", "purple"];

export function getPaletteIds(): PaletteId[] {
  return PALETTE_IDS;
}

export function getPaletteBase(id: PaletteId): string | undefined {
  if (id === "default") return undefined;
  return PALETTE_BASES[id];
}

export function getSeriesColor(index: number, paletteId: PaletteId = "default"): string {
  if (paletteId === "default") {
    return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
  }
  const palette = COLORBREWER_PALETTES[paletteId];
  return palette[index % palette.length];
}

/** Get current theme colors from CSS variables */
export function getThemeColors(): {
  text: string;
  muted: string;
  gridLine: string;
  surface: string;
} {
  const s = getComputedStyle(document.documentElement);
  return {
    text: s.getPropertyValue("--text").trim(),
    muted: s.getPropertyValue("--muted").trim(),
    gridLine: s.getPropertyValue("--border").trim(),
    surface: s.getPropertyValue("--surface").trim(),
  };
}
