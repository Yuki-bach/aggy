import { useRef, useState } from "preact/hooks";
import type { JSX } from "preact";

interface DropzoneProps {
  accept: string;
  icon: string;
  text: string;
  hint: string;
  loadedFileName: string | null;
  onFile: (file: File) => void;
}

export function Dropzone({ accept, icon, text, hint, loadedFileName, onFile }: DropzoneProps) {
  const [isDragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoaded = loadedFileName != null;

  function handleChange(e: JSX.TargetedEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0];
    if (f) onFile(f);
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
      class={`relative cursor-pointer rounded-lg border-2 border-dashed border-border-strong px-4 py-5 text-center transition-[border-color,background] duration-150 hover:border-accent hover:bg-accent-bg${isDragOver ? " drag-over" : ""}${isLoaded ? " loaded" : ""}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        onChange={handleChange}
      />
      <div class="pointer-events-none flex flex-col items-center gap-1">
        <span class="rounded-sm bg-accent-light px-3 py-1 text-[0.8125rem] font-bold tracking-[0.04em] text-accent">
          {icon}
        </span>
        {isLoaded ? (
          <>
            <span class="max-w-full truncate text-[0.875rem] font-medium text-[var(--color-success-700)]">
              {loadedFileName}
            </span>
            <span class="text-xs text-muted">{hint}</span>
          </>
        ) : (
          <>
            <span class="text-[0.875rem] font-medium text-text-secondary">{text}</span>
            <span class="text-xs text-muted">{hint}</span>
          </>
        )}
      </div>
    </div>
  );
}
