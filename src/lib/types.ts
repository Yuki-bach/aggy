import type { Layout } from "./layout";

export type CsvData = { fileName: string; headers: string[]; rowCount: number };
export type LayoutData = {
  fileName: string;
  layout: Layout;
  dateWarnings?: string[];
};
