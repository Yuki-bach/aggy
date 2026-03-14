import { useEffect, useState } from "preact/hooks";
import { t } from "../../lib/i18n";
import { runValidation } from "../../lib/duckdb";
import type { Diagnostics } from "../../lib/validateRawData";
import type { RawData, LayoutData } from "../../lib/types";

interface ValidationStepProps {
  rawData: RawData;
  layout: LayoutData;
  onProceed: () => void;
  onBack: () => void;
}

export function ValidationStep({ rawData, layout, onProceed, onBack }: ValidationStepProps) {
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDiagnostics(null);
    setError(null);

    runValidation(rawData.headers, layout.layout)
      .then((r) => {
        if (!cancelled) setDiagnostics(r);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });

    return () => {
      cancelled = true;
    };
  }, [rawData, layout]);

  if (error) {
    return (
      <div class="space-y-4">
        <p class="text-sm text-red-600">{error}</p>
        <button
          class="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
          onClick={onBack}
        >
          {t("validation.back")}
        </button>
      </div>
    );
  }

  if (!diagnostics) {
    return <p class="py-4 text-center text-sm text-muted">{t("validation.running")}</p>;
  }

  const statusByType = new Map<string, "error" | "warn">();
  for (const d of diagnostics) statusByType.set(d.type, d.severity);

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warn");

  return (
    <div class="space-y-4">
      <h3 class="text-sm font-bold tracking-wider text-muted">{t("validation.title")}</h3>

      <ul class="space-y-2 text-sm">
        <CheckItem
          label={t("validation.check.columns")}
          status={statusByType.get("dropped") ?? "ok"}
        />
        <CheckItem
          label={t("validation.check.saCode")}
          status={statusByType.get("unknownCode") ?? "ok"}
        />
        <CheckItem
          label={t("validation.check.maValues")}
          status={statusByType.get("invalidMAValue") ?? "ok"}
        />
        <CheckItem
          label={t("validation.check.numeric")}
          status={statusByType.get("nonNumeric") ?? "ok"}
        />
      </ul>

      {errors.length > 0 && (
        <div class="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <ul class="list-inside list-disc space-y-1">
            {errors.map((d) => (
              <li key={`${d.type}-${d.key}`}>
                {t(`validation.detail.${d.type}`, { key: d.key, label: d.label, ...d.params })}
              </li>
            ))}
          </ul>
          <p class="mt-2 font-medium">{t("validation.fixPrompt")}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <ul class="list-inside list-disc space-y-1">
            {warnings.map((d) => (
              <li key={`${d.type}-${d.key}`}>
                {t(`validation.detail.${d.type}`, { key: d.key, label: d.label, ...d.params })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="flex gap-3 pt-2">
        <button
          class="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
          onClick={onBack}
        >
          {t("validation.back")}
        </button>
        {errors.length === 0 && (
          <button
            class="cursor-pointer rounded-lg border-none bg-accent px-4 py-2 text-sm font-bold text-accent-contrast transition-colors hover:bg-accent-hover"
            onClick={onProceed}
          >
            {t("import.proceed")}
          </button>
        )}
      </div>
    </div>
  );
}

function CheckItem({ label, status }: { label: string; status: "ok" | "warn" | "error" }) {
  const icon = status === "ok" ? "\u2713" : status === "warn" ? "!" : "\u2717";
  const color =
    status === "ok"
      ? "text-green-600 dark:text-green-400"
      : status === "warn"
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <li class="flex items-center gap-2">
      <span
        class={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${color}`}
      >
        {icon}
      </span>
      <span class="text-text">{label}</span>
      <span class={`text-xs font-medium ${color}`}>{t(`validation.${status}`)}</span>
    </li>
  );
}
