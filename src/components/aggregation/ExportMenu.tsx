import type { ComponentChildren } from "preact";
import { useRef, useState, useEffect, useCallback } from "preact/hooks";
import { t } from "../../lib/i18n";
import type { ExportAction } from "../../lib/export/export";

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

  const showFeedback = feedback !== null;

  return (
    <div ref={ref} class="relative">
      <button
        class="relative flex size-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-accent hover:text-accent"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("export.label")}
        title={t("export.label")}
      >
        {showFeedback ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>

      {open && (
        <div class="absolute right-0 z-10 mt-1 min-w-48 rounded-lg border border-border bg-surface shadow-lg">
          <SectionLabel>{t("export.section.copy")}</SectionLabel>
          <MenuItem label="TSV" onClick={() => handleAction("copy-tsv")} />
          <MenuItem label="Markdown" onClick={() => handleAction("copy-markdown")} />
          <MenuItem label="JSON" onClick={() => handleAction("copy-json")} />

          <div class="mx-3 my-1 border-t border-border" />

          <SectionLabel class="pt-1.5">{t("export.section.download")}</SectionLabel>
          <div class="pb-1.5">
            <MenuItem label="CSV" onClick={() => handleAction("download-csv")} />
            <MenuItem label="Markdown (.md)" onClick={() => handleAction("download-markdown")} />
            <MenuItem label="JSON (.json)" onClick={() => handleAction("download-json")} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Internal ───────────────────────────────────────────────

function SectionLabel({ class: cls, children }: { class?: string; children: ComponentChildren }) {
  return (
    <div
      class={`px-3 pt-2.5 pb-1 text-xs font-medium tracking-wide text-muted uppercase${cls ? ` ${cls}` : ""}`}
    >
      {children}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      class="block w-full cursor-pointer px-3 py-1.5 text-left text-xs text-text hover:bg-accent-bg"
      onClick={onClick}
    >
      {label}
    </button>
  );
}
