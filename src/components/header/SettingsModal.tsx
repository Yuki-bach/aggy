import { useEffect, useRef, useState } from "preact/hooks";
import { t, getLocale, setLocale, onLocaleChange } from "../../lib/i18n";

export function isAICommentEnabled(): boolean {
  return localStorage.getItem(AI_KEY) !== "off";
}

export function applyTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);

  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
  } else if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
}

export function SettingsRoot() {
  const [open, setOpen] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [, setTick] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // System theme change listener
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (getStoredTheme() === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Re-render on locale change
  useEffect(() => {
    onLocaleChange(() => setTick((n) => n + 1));
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = async (e: MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
    } else {
      // Check AI availability once
      if (typeof LanguageModel !== "undefined" && (await LanguageModel.availability()) !== "no") {
        setAiAvailable(true);
      }
      setOpen(true);
    }
  };

  const rerender = () => setTick((n) => n + 1);

  return (
    <div class="relative" ref={wrapRef}>
      <button
        id="settings-btn"
        class="cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-base leading-none text-text transition-[background,border-color] duration-150 hover:border-border-strong hover:bg-surface2"
        data-i18n="header.settings"
        data-i18n-attr="aria-label"
        aria-label={t("header.settings")}
        onClick={handleToggle}
      >
        ⚙
      </button>
      {open && (
        <div class="absolute top-[calc(100%+8px)] right-0 z-100 w-[300px] rounded-xl border border-border bg-surface p-4 shadow-lg">
          <SettingsPanel showAI={aiAvailable} onRerender={rerender} />
        </div>
      )}
    </div>
  );
}

/** Apply stored theme on app startup (call once in App useEffect) */
export function initTheme(): void {
  applyTheme(getStoredTheme());
}

// ─── Internal ───────────────────────────────────────────────

const THEME_KEY = "aggy-theme";
const AI_KEY = "aggy-ai-comment";

type Theme = "light" | "dark" | "system";

function setAIComment(on: boolean): void {
  localStorage.setItem(AI_KEY, on ? "on" : "off");
}

function getStoredTheme(): Theme {
  const v = localStorage.getItem(THEME_KEY);
  if (v === "dark" || v === "light" || v === "system") return v;
  return "system";
}

function SegmentControl({
  name,
  options,
  current,
  onChange,
}: {
  name: string;
  options: { value: string; label: string }[];
  current: string;
  onChange: (value: string) => void;
}) {
  return (
    <div class="flex gap-[2px] rounded-lg bg-surface2 p-[2px]" data-seg-name={name}>
      {options.map((o) => (
        <button
          key={o.value}
          class={`flex-1 cursor-pointer whitespace-nowrap rounded-[6px] border-none px-3 py-1 text-xs transition-[background,color,box-shadow] duration-150 hover:text-text ${o.value === current ? "bg-surface text-text shadow-[0_1px_3px_rgba(0,0,0,0.1)]" : "bg-transparent text-muted"}`}
          onClick={(e) => {
            e.stopPropagation();
            onChange(o.value);
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SettingsPanel({ showAI, onRerender }: { showAI: boolean; onRerender: () => void }) {
  const locale = getLocale();
  const theme = getStoredTheme();

  return (
    <>
      <div class="mb-4 last:mb-0">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.04em] text-muted">
          {t("settings.language")}
        </span>
        <SegmentControl
          name="lang"
          options={[
            { value: "ja", label: "日本語" },
            { value: "en", label: "English" },
          ]}
          current={locale}
          onChange={(v) => {
            setLocale(v);
            onRerender();
          }}
        />
      </div>
      <div class="mb-4 last:mb-0">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.04em] text-muted">
          {t("settings.theme")}
        </span>
        <SegmentControl
          name="theme"
          options={[
            { value: "light", label: t("settings.theme.light") },
            { value: "dark", label: t("settings.theme.dark") },
            { value: "system", label: t("settings.theme.system") },
          ]}
          current={theme}
          onChange={(v) => {
            applyTheme(v as Theme);
            onRerender();
          }}
        />
      </div>
      {showAI && (
        <div class="mb-4 last:mb-0">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.04em] text-muted">
            {t("settings.ai")}
          </span>
          <SegmentControl
            name="ai"
            options={[
              { value: "on", label: t("settings.ai.on") },
              { value: "off", label: t("settings.ai.off") },
            ]}
            current={isAICommentEnabled() ? "on" : "off"}
            onChange={(v) => {
              setAIComment(v === "on");
              onRerender();
            }}
          />
        </div>
      )}
    </>
  );
}
