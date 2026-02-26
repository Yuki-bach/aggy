import type { LayoutMeta } from "./layout";

export type CsvData = { text: string; fileName: string; headers: string[]; rowCount: number };
export type LayoutData = { json: string; fileName: string; meta: LayoutMeta };
