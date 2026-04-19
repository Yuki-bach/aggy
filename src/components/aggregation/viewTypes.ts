import type { PaletteId } from "../../lib/chartConfig";

export type ChartType = "bar-h" | "bar-v" | "obi";
export type ViewMode = "table" | "chart";
export type Basis = "column" | "row";

export interface TableOpts {
  basis: Basis;
}

export interface ChartOpts {
  saChartType: ChartType;
  maChartType: ChartType;
  paletteId: PaletteId;
}
