import { useRef, useState, useEffect, useCallback } from "preact/hooks";
import { t } from "../../lib/i18n";
import type { ExportAction } from "../../lib/agg/export";

interface ExportMenuProps {
  onExport: (action: ExportAction) => void;
}

export function ExportMenu({ onExport }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleAction = useCallback(
    (action: ExportAction) => {
      setOpen(false);
      onExport(action);

      if (action.startsWith("copy-")) {
        setFeedback(t("export.copied"));
        setTimeout(() => setFeedback(null), 1500);
      }
    },
    [onExport],
  );

  const buttonLabel = feedback ?? t("export.label");

  return (
    <div ref={ref} class="relative">
      <button
        class="m-0 min-h-9 w-auto cursor-pointer rounded-lg border border-accent bg-transparent px-4 py-2 text-[0.875rem] font-medium text-accent transition-[background] duration-150 hover:bg-accent-bg"
        onClick={() => setOpen((v) => !v)}
      >
        {buttonLabel}
      </button>

      {open && (
        <div class="absolute right-0 z-10 mt-1 min-w-48 rounded-lg border border-border bg-surface shadow-lg">
          <div class="px-3 pt-2.5 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted uppercase">
            {t("export.section.copy")}
          </div>
          <MenuItem label={t("export.copy.tsv")} onClick={() => handleAction("copy-tsv")} />
          <MenuItem
            label={t("export.copy.markdown")}
            onClick={() => handleAction("copy-markdown")}
          />
          <MenuItem label={t("export.copy.json")} onClick={() => handleAction("copy-json")} />

          <div class="mx-3 my-1 border-t border-border" />

          <div class="px-3 pt-1.5 pb-1 text-[0.6875rem] font-medium tracking-wide text-muted uppercase">
            {t("export.section.download")}
          </div>
          <MenuItem label={t("export.download.csv")} onClick={() => handleAction("download-csv")} />
          <MenuItem
            label={t("export.download.markdown")}
            onClick={() => handleAction("download-markdown")}
          />
          <MenuItem
            label={t("export.download.json")}
            onClick={() => handleAction("download-json")}
            last
          />
        </div>
      )}
    </div>
  );
}

// ─── Internal ───────────────────────────────────────────────

function MenuItem({
  label,
  onClick,
  last,
}: {
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      class={`block w-full cursor-pointer border-none bg-transparent px-3 py-1.5 text-left text-[0.8125rem] text-text hover:bg-accent-bg ${last ? "pb-2.5" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
