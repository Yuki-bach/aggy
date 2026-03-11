import type { PaletteId } from "../../lib/chartConfig";

export type ChartType = "bar-h" | "bar-v" | "obi";
export type ViewMode = "table" | "chart";
export type PctDirection = "vertical" | "horizontal";

export interface TableOpts {
  pctDirection: PctDirection;
  maxPct: number;
}

export interface ChartOpts {
  saChartType: ChartType;
  maChartType: ChartType;
  paletteId: PaletteId;
}
