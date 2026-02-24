import { parseLayout, buildLayoutMeta, type Layout, type LayoutMeta } from "../../lib/layout";

export function initCsvInput(
  onLoad: (csvText: string, fileName: string) => void,
  onError: (msg: string) => void,
): void {
  const fileInput = document.getElementById("file-input") as HTMLInputElement;

  fileInput.addEventListener("change", (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  });

  async function handleFile(file: File) {
    try {
      const csvText = await file.text();
      onLoad(csvText, file.name);
    } catch (err) {
      onError((err as Error).message);
    }
  }
}

export function initLayoutInput(
  onLoad: (layout: Layout, meta: LayoutMeta, fileName: string, rawText: string) => void,
  onError: (msg: string) => void,
): void {
  const fileInput = document.getElementById("layout-file-input") as HTMLInputElement;

  fileInput.addEventListener("change", (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  });

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const layout = parseLayout(text);
      const meta = buildLayoutMeta(layout);
      onLoad(layout, meta, file.name, text);
    } catch (err) {
      onError("レイアウトファイルの読み込みエラー: " + (err as Error).message);
    }
  }
}
