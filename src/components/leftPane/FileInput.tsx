import { parseLayout, buildLayoutMeta, type Layout, type LayoutMeta } from "../../lib/layout";
import { t } from "../../lib/i18n";

/** ドロップゾーンのdrag&dropイベントをセットアップ */
function initDropzone(
  dropzoneId: string,
  inputId: string,
  acceptExt: string,
  onFile: (file: File) => void,
): void {
  const zone = document.getElementById(dropzoneId)!;
  const input = document.getElementById(inputId) as HTMLInputElement;

  // input change
  input.addEventListener("change", () => {
    const f = input.files?.[0];
    if (f) onFile(f);
  });

  // drag events
  zone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    // dragleave は子要素に出入りしても発火するので、zone外に出たときだけ解除
    if (!zone.contains(e.relatedTarget as Node)) {
      zone.classList.remove("drag-over");
    }
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");

    const file = e.dataTransfer?.files[0];
    if (!file) return;

    // 拡張子チェック
    if (!file.name.toLowerCase().endsWith(acceptExt)) {
      return;
    }

    onFile(file);
  });
}

/** ドロップゾーンを「読み込み済み」状態にする */
function markLoaded(dropzoneId: string, loadedId: string, fileName: string): void {
  const zone = document.getElementById(dropzoneId)!;
  const content = zone.querySelector(".dropzone-content") as HTMLElement;
  const loaded = document.getElementById(loadedId)!;

  zone.classList.add("loaded");
  content.classList.add("hidden");
  loaded.textContent = `${fileName}`;
  loaded.classList.remove("hidden");
}

export function initCsvInput(
  onLoad: (csvText: string, fileName: string) => void,
  onError: (msg: string) => void,
): void {
  initDropzone("csv-dropzone", "file-input", ".csv", (file) => handleCsvFile(file));

  async function handleCsvFile(file: File) {
    try {
      const csvText = await file.text();
      markLoaded("csv-dropzone", "csv-dropzone-loaded", file.name);
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
  initDropzone("layout-dropzone", "layout-file-input", ".json", (file) => handleLayoutFile(file));

  async function handleLayoutFile(file: File) {
    try {
      const text = await file.text();
      const layout = parseLayout(text);
      const meta = buildLayoutMeta(layout);
      markLoaded("layout-dropzone", "layout-dropzone-loaded", file.name);
      onLoad(layout, meta, file.name, text);
    } catch (err) {
      onError(t("error.layout.load", { msg: (err as Error).message }));
    }
  }
}
