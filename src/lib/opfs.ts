export interface SavedEntry {
  folderId: string;
  rawDataName: string;
  layoutName: string;
  timestamp: number;
}

export async function saveData(
  rawDataName: string,
  rawDataText: string,
  layoutName: string,
  layoutJson: string,
): Promise<SavedEntry> {
  const ts = Date.now();
  const folderId = String(ts);
  const dir = await getAggyDir();
  const folder = await dir.getDirectoryHandle(folderId, { create: true });

  const rawDataHandle = await folder.getFileHandle(rawDataName, { create: true });
  const rawDataW = await rawDataHandle.createWritable();
  await rawDataW.write(rawDataText);
  await rawDataW.close();

  const jsonHandle = await folder.getFileHandle(layoutName, { create: true });
  const jsonW = await jsonHandle.createWritable();
  await jsonW.write(layoutJson);
  await jsonW.close();

  return { folderId, rawDataName, layoutName, timestamp: ts };
}

export async function listSaved(): Promise<SavedEntry[]> {
  const dir = await getAggyDir();
  const entries: SavedEntry[] = [];

  for await (const [name, handle] of dir.entries()) {
    if (handle.kind !== "directory") continue;
    const ts = Number(name);
    if (!Number.isFinite(ts)) continue;

    let rawDataName = "";
    let layoutName = "";
    for await (const [fileName] of handle.entries()) {
      if (fileName.endsWith(".csv")) rawDataName = fileName;
      else if (fileName.endsWith(".json")) layoutName = fileName;
    }
    if (rawDataName && layoutName) {
      entries.push({ folderId: name, rawDataName, layoutName, timestamp: ts });
    }
  }

  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries;
}

export async function loadSaved(
  folderId: string,
): Promise<{ rawDataText: string; rawDataName: string; layoutJson: string; layoutName: string }> {
  const dir = await getAggyDir();
  const folder = await dir.getDirectoryHandle(folderId);

  let rawDataName = "";
  let layoutName = "";
  for await (const [fileName] of folder.entries()) {
    if (fileName.endsWith(".csv")) rawDataName = fileName;
    else if (fileName.endsWith(".json")) layoutName = fileName;
  }
  if (!rawDataName || !layoutName) throw new Error("不完全な保存データです");

  const rawDataFile = await (await folder.getFileHandle(rawDataName)).getFile();
  const rawDataText = await rawDataFile.text();
  const jsonFile = await (await folder.getFileHandle(layoutName)).getFile();
  const layoutJson = await jsonFile.text();

  return { rawDataText, rawDataName, layoutJson, layoutName };
}

export async function deleteSaved(folderId: string): Promise<void> {
  const dir = await getAggyDir();
  await dir.removeEntry(folderId, { recursive: true });
}

// ─── Internal ───────────────────────────────────────────────

async function getAggyDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle("aggy-data", { create: true });
}
