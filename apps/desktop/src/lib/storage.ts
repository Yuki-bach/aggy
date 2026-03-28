import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir, writeTextFile, readTextFile, readDir, remove } from "@tauri-apps/plugin-fs";

export type SavedEntry = {
  folderId: string;
  rawDataName: string;
  layoutName: string;
  timestamp: number;
};

async function getAggyDir(): Promise<string> {
  const base = await appDataDir();
  const dir = await join(base, "aggy-data");
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function saveEntry(
  rawDataName: string,
  rawDataText: string,
  layoutName: string,
  layoutJson: string,
): Promise<SavedEntry> {
  const ts = Date.now();
  const folderId = String(ts);
  const dir = await getAggyDir();
  const folderPath = await join(dir, folderId);
  await mkdir(folderPath, { recursive: true });
  await writeTextFile(await join(folderPath, rawDataName), rawDataText);
  await writeTextFile(await join(folderPath, layoutName), layoutJson);
  return { folderId, rawDataName, layoutName, timestamp: ts };
}

export async function listEntries(): Promise<SavedEntry[]> {
  const dir = await getAggyDir();
  const folders = await readDir(dir);
  const entries: SavedEntry[] = [];

  for (const folder of folders) {
    if (!folder.isDirectory) continue;
    const ts = Number(folder.name);
    if (!Number.isFinite(ts)) continue;

    const folderPath = await join(dir, folder.name);
    const files = await readDir(folderPath);
    let rawDataName = "";
    let layoutName = "";
    for (const f of files) {
      if (f.name?.endsWith(".csv")) rawDataName = f.name;
      else if (f.name?.endsWith(".json")) layoutName = f.name;
    }
    if (rawDataName && layoutName) {
      entries.push({ folderId: folder.name, rawDataName, layoutName, timestamp: ts });
    }
  }

  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries;
}

export async function loadEntry(folderId: string): Promise<{
  rawDataText: string;
  rawDataName: string;
  layoutJson: string;
  layoutName: string;
}> {
  const dir = await getAggyDir();
  const folderPath = await join(dir, folderId);
  const files = await readDir(folderPath);

  let rawDataName = "";
  let layoutName = "";
  for (const f of files) {
    if (f.name?.endsWith(".csv")) rawDataName = f.name;
    else if (f.name?.endsWith(".json")) layoutName = f.name;
  }
  if (!rawDataName || !layoutName) throw new Error("不完全な保存データです");

  const rawDataText = await readTextFile(await join(folderPath, rawDataName));
  const layoutJson = await readTextFile(await join(folderPath, layoutName));
  return { rawDataText, rawDataName, layoutJson, layoutName };
}

export async function deleteEntry(folderId: string): Promise<void> {
  const dir = await getAggyDir();
  const folderPath = await join(dir, folderId);
  await remove(folderPath, { recursive: true });
}
