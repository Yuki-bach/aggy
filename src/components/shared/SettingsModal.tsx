import { render } from "preact";
import { t, getLocale, setLocale, onLocaleChange } from "../../lib/i18n";

const THEME_KEY = "temotto-theme";
const AI_KEY = "temotto-ai-comment";

type Theme = "light" | "dark" | "system";

export function isAICommentEnabled(): boolean {
  return localStorage.getItem(AI_KEY) !== "off";
}

function setAIComment(on: boolean): void {
  localStorage.setItem(AI_KEY, on ? "on" : "off");
}

function getStoredTheme(): Theme {
  const v = localStorage.getItem(THEME_KEY);
  if (v === "dark" || v === "light" || v === "system") return v;
  return "system";
}

function applyTheme(theme: Theme): void {
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
    <div class="seg-control" data-seg-name={name}>
      {options.map((o) => (
        <button
          key={o.value}
          class={`seg-btn${o.value === current ? " active" : ""}`}
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
      <div class="settings-group">
        <span class="settings-label">{t("settings.language")}</span>
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
      <div class="settings-group">
        <span class="settings-label">{t("settings.theme")}</span>
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
        <div class="settings-group">
          <span class="settings-label">{t("settings.ai")}</span>
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

let aiAvailable = false;

function isOpen(): boolean {
  return !document.getElementById("settings-panel")!.classList.contains("hidden");
}

function renderPanel(): void {
  const panel = document.getElementById("settings-panel")!;
  render(<SettingsPanel showAI={aiAvailable} onRerender={renderPanel} />, panel);
}

async function show(): Promise<void> {
  // Check AI availability once
  if (typeof LanguageModel !== "undefined" && (await LanguageModel.availability()) !== "no") {
    aiAvailable = true;
  }
  const panel = document.getElementById("settings-panel")!;
  renderPanel();
  panel.classList.remove("hidden");
}

function hide(): void {
  document.getElementById("settings-panel")!.classList.add("hidden");
}

function toggle(): void {
  if (isOpen()) {
    hide();
  } else {
    show();
  }
}

export function initSettings(): void {
  applyTheme(getStoredTheme());

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });

  document.getElementById("settings-btn")!.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const wrap = document.querySelector(".settings-wrap")!;
    if (!wrap.contains(e.target as Node)) hide();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) hide();
  });

  onLocaleChange(() => {
    if (isOpen()) renderPanel();
  });
}
