import type { PaletteId } from "../../lib/chartConfig";
import type { Basis, ChartType, ViewMode } from "./viewTypes";

export interface ToolbarCallbacks {
  onViewModeChange: (mode: ViewMode) => void;
  onSaChartTypeChange: (type: ChartType) => void;
  onMaChartTypeChange: (type: ChartType) => void;
  onBasisChange: (basis: Basis) => void;
  onPaletteChange: (id: PaletteId) => void;
}
