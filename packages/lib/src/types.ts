export type RawData = { fileName: string; headers: string[]; rowCount: number };
export type LayoutData = { fileName: string; rawJson: unknown[] };
export type SavedEntry = {
  folderId: string;
  rawDataName: string;
  layoutName: string;
  timestamp: number;
};
