import type { Tally } from "../../agg/types";
import { downloadFile, today } from "../export";

export function formatJSON(tallies: Tally[], weightCol: string): string {
	return JSON.stringify({ weightColumn: weightCol || null, results: tallies }, null, 2);
}

export function downloadJSON(tallies: Tally[], weightCol: string, hasCross?: boolean): void {
	const json = formatJSON(tallies, weightCol);
	const prefix = hasCross ? "cross_result" : "gt_result";
	downloadFile(json, `${prefix}_${today()}.json`, "application/json;charset=utf-8;");
}
