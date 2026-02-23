export interface SavedEntry {
  folderId: string;
  csvName: string;
  layoutName: string;
  timestamp: number;
}

async function getTemottoDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle("temotto-data", { create: true });
}

export async function saveData(
  csvName: string,
  csvText: string,
  layoutName: string,
  layoutJson: string,
): Promise<SavedEntry> {
  const ts = Date.now();
  const folderId = String(ts);
  const dir = await getTemottoDir();
  const folder = await dir.getDirectoryHandle(folderId, { create: true });

  const csvHandle = await folder.getFileHandle(csvName, { create: true });
  const csvW = await csvHandle.createWritable();
  await csvW.write(csvText);
  await csvW.close();

  const jsonHandle = await folder.getFileHandle(layoutName, { create: true });
  const jsonW = await jsonHandle.createWritable();
  await jsonW.write(layoutJson);
  await jsonW.close();

  return { folderId, csvName, layoutName, timestamp: ts };
}

export async function listSaved(): Promise<SavedEntry[]> {
  const dir = await getTemottoDir();
  const entries: SavedEntry[] = [];

  for await (const [name, handle] of dir as any) {
    if (handle.kind !== "directory") continue;
    const ts = Number(name);
    if (!Number.isFinite(ts)) continue;

    let csvName = "";
    let layoutName = "";
    for await (const [fileName] of handle as any) {
      if (fileName.endsWith(".csv")) csvName = fileName;
      else if (fileName.endsWith(".json")) layoutName = fileName;
    }
    if (csvName && layoutName) {
      entries.push({ folderId: name, csvName, layoutName, timestamp: ts });
    }
  }

  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries;
}

export async function loadSaved(
  folderId: string,
): Promise<{ csvText: string; csvName: string; layoutJson: string; layoutName: string }> {
  const dir = await getTemottoDir();
  const folder = await dir.getDirectoryHandle(folderId);

  let csvName = "";
  let layoutName = "";
  for await (const [fileName] of folder as any) {
    if (fileName.endsWith(".csv")) csvName = fileName;
    else if (fileName.endsWith(".json")) layoutName = fileName;
  }
  if (!csvName || !layoutName) throw new Error("不完全な保存データです");

  const csvFile = await (await folder.getFileHandle(csvName)).getFile();
  const csvText = await csvFile.text();
  const jsonFile = await (await folder.getFileHandle(layoutName)).getFile();
  const layoutJson = await jsonFile.text();

  return { csvText, csvName, layoutJson, layoutName };
}

export async function deleteSaved(folderId: string): Promise<void> {
  const dir = await getTemottoDir();
  await dir.removeEntry(folderId, { recursive: true });
}
