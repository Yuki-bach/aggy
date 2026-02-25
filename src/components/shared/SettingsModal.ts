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

function buildSegment(
  name: string,
  options: { value: string; label: string }[],
  current: string,
): string {
  const buttons = options
    .map(
      (o) =>
        `<button class="seg-btn${o.value === current ? " active" : ""}" data-seg="${name}" data-value="${o.value}">${o.label}</button>`,
    )
    .join("");
  return `<div class="seg-control" data-seg-name="${name}">${buttons}</div>`;
}

async function buildPanelHTML(): Promise<string> {
  const locale = getLocale();
  const theme = getStoredTheme();

  let html = `
    <div class="settings-group">
      <span class="settings-label">${t("settings.language")}</span>
      ${buildSegment(
        "lang",
        [
          { value: "ja", label: "日本語" },
          { value: "en", label: "English" },
        ],
        locale,
      )}
    </div>
    <div class="settings-group">
      <span class="settings-label">${t("settings.theme")}</span>
      ${buildSegment(
        "theme",
        [
          { value: "light", label: t("settings.theme.light") },
          { value: "dark", label: t("settings.theme.dark") },
          { value: "system", label: t("settings.theme.system") },
        ],
        theme,
      )}
    </div>
  `;

  if (typeof LanguageModel !== "undefined" && (await LanguageModel.availability()) !== "no") {
    const aiVal = isAICommentEnabled() ? "on" : "off";
    html += `
    <div class="settings-group">
      <span class="settings-label">${t("settings.ai")}</span>
      ${buildSegment(
        "ai",
        [
          { value: "on", label: t("settings.ai.on") },
          { value: "off", label: t("settings.ai.off") },
        ],
        aiVal,
      )}
    </div>
    `;
  }

  return html;
}

function bindSegmentEvents(panel: HTMLElement): void {
  panel.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".seg-btn");
    if (!btn) return;

    const name = btn.dataset.seg!;
    const value = btn.dataset.value!;

    // Update active state
    for (const b of panel.querySelectorAll<HTMLButtonElement>(`[data-seg="${name}"]`)) {
      b.classList.toggle("active", b === btn);
    }

    if (name === "lang") {
      setLocale(value);
    } else if (name === "theme") {
      applyTheme(value as Theme);
    } else if (name === "ai") {
      setAIComment(value === "on");
    }
  });
}

function isOpen(): boolean {
  return !document.getElementById("settings-panel")!.classList.contains("hidden");
}

async function show(): Promise<void> {
  const panel = document.getElementById("settings-panel")!;
  panel.innerHTML = await buildPanelHTML();
  panel.classList.remove("hidden");
  bindSegmentEvents(panel);
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

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const wrap = document.querySelector(".settings-wrap")!;
    if (!wrap.contains(e.target as Node)) hide();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) hide();
  });

  // Rebuild panel content when locale changes (if open)
  onLocaleChange(() => {
    if (isOpen()) show();
  });
}
