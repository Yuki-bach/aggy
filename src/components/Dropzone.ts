import { readFileAsText } from "../lib/csv";

export function initDropzone(
  onLoad: (csvText: string, fileName: string) => void,
  onError: (msg: string) => void
): void {
  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  const dropzone = document.getElementById("dropzone")!;

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
      const csvText = await readFileAsText(file);
      onLoad(csvText, file.name);
    } catch (err) {
      onError((err as Error).message);
    }
  }
}
