import { useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import { t } from "../../lib/i18n";

interface FileUploadPanelProps {
  rawDataFileName: string | null;
  layoutFileName: string | null;
  onRawDataFile: (file: File) => void;
  onLayoutFile: (file: File) => void;
}

export function FileUploadPanel({
  rawDataFileName,
  layoutFileName,
  onRawDataFile,
  onLayoutFile,
}: FileUploadPanelProps) {
  return (
    <div class="flex flex-col gap-3 md:flex-row">
      <div class="flex-1">
        <Dropzone
          accept=".csv"
          icon={t("dropzone.csv.icon")}
          text={t("dropzone.csv.text")}
          loadedFileName={rawDataFileName}
          onFile={onRawDataFile}
        />
      </div>
      <div class="flex-1">
        <Dropzone
          accept=".json"
          icon={t("dropzone.layout.icon")}
          text={t("dropzone.layout.text")}
          loadedFileName={layoutFileName}
          onFile={onLayoutFile}
        />
      </div>
    </div>
  );
}

// ─── Internal ───────────────────────────────────────────────

interface DropzoneProps {
  accept: string;
  icon: string;
  text: string;
  loadedFileName: string | null;
  onFile: (file: File) => void;
}

function Dropzone({ accept, icon, text, loadedFileName, onFile }: DropzoneProps) {
  const [isDragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoaded = loadedFileName !== null;

  function handleChange(e: JSX.TargetedEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0];
    if (f) onFile(f);
    e.currentTarget.value = "";
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    const zone = e.currentTarget as HTMLElement;
    if (!zone.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer?.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(accept)) return;

    onFile(file);
  }

  return (
    <div
      class={`relative rounded-lg border-2 border-dashed border-border-strong px-4 py-5 transition-colors hover:border-accent hover:bg-accent-bg${isDragOver ? " drag-over" : ""}${isLoaded ? " loaded" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        class="absolute inset-0 cursor-pointer opacity-0"
        onChange={handleChange}
      />
      <div class="pointer-events-none flex flex-col items-center gap-1">
        <span class="rounded-sm bg-accent-light px-3 py-1 text-xs font-bold tracking-wide text-accent">
          {icon}
        </span>
        {isLoaded ? (
          <span class="max-w-full truncate text-sm font-medium text-[var(--color-success-700)]">
            {loadedFileName}
          </span>
        ) : (
          <span class="text-sm font-medium text-text-secondary">{text}</span>
        )}
      </div>
    </div>
  );
}
