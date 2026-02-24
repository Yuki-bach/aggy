/** Chart.js 設定・登録（tree-shaken） */

import {
  Chart,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
);

export { Chart };

/** アンケート集計用カラーパレット（ライト/ダーク両対応） */
const PALETTE = [
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

export function getSeriesColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

/** CSS変数から現テーマの色を取得 */
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
