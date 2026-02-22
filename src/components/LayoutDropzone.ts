import { parseLayout, buildLayoutMeta, type Layout, type LayoutMeta } from "../lib/layout";

export function initLayoutDropzone(
  onLoad: (layout: Layout, meta: LayoutMeta, fileName: string) => void,
  onError: (msg: string) => void
): void {
  const fileInput = document.getElementById("layout-file-input") as HTMLInputElement;
  const dropzone = document.getElementById("layout-dropzone")!;

  fileInput.addEventListener("change", (e) => {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleFile(f);
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
  dropzone.addEventListener("dragleave", () =>
    dropzone.classList.remove("dragover")
  );
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const f = (e as DragEvent).dataTransfer?.files[0];
    if (f) handleFile(f);
  });

  async function handleFile(file: File) {
    try {
      const text = await file.text();
      const layout = parseLayout(text);
      const meta = buildLayoutMeta(layout);
      onLoad(layout, meta, file.name);
    } catch (err) {
      onError("レイアウトファイルの読み込みエラー: " + (err as Error).message);
    }
  }
}
