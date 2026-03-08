import type { PaletteId } from "../../lib/chartConfig";
import type { ChartType } from "./ChartCardBody";

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
