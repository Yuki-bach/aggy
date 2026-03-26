const THEME_KEY = "aggy-theme";
const AI_KEY = "aggy-ai-comment";

export type Theme = "light" | "dark" | "system";

export function isAICommentEnabled(): boolean {
  return localStorage.getItem(AI_KEY) !== "off";
}

export function setAIComment(on: boolean): void {
  localStorage.setItem(AI_KEY, on ? "on" : "off");
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

export function getStoredTheme(): Theme {
  const v = localStorage.getItem(THEME_KEY);
  if (v === "dark" || v === "light" || v === "system") return v;
  return "system";
}

/** Apply stored theme on app startup (call once) */
export function initTheme(): void {
  applyTheme(getStoredTheme());
}
