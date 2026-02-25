import { t, getLocale, setLocale, onLocaleChange } from "../../lib/i18n";

const THEME_KEY = "temotto-theme";

type Theme = "light" | "dark" | "system";

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

function buildModalHTML(): string {
  const locale = getLocale();
  const theme = getStoredTheme();

  return `
    <div class="modal-content settings-modal-content" role="document">
      <button class="modal-close" id="settings-close" aria-label="${t("settings.close")}">&times;</button>
      <h2 id="settings-title" class="modal-title">${t("settings.title")}</h2>

      <div class="modal-body">
        <div class="settings-group">
          <label class="settings-label">${t("settings.language")}</label>
          <div class="settings-options">
            <label class="settings-radio">
              <input type="radio" name="settings-lang" value="ja" ${locale === "ja" ? "checked" : ""}>
              日本語
            </label>
            <label class="settings-radio">
              <input type="radio" name="settings-lang" value="en" ${locale === "en" ? "checked" : ""}>
              English
            </label>
          </div>
        </div>

        <div class="settings-group">
          <label class="settings-label">${t("settings.theme")}</label>
          <div class="settings-options">
            <label class="settings-radio">
              <input type="radio" name="settings-theme" value="light" ${theme === "light" ? "checked" : ""}>
              ${t("settings.theme.light")}
            </label>
            <label class="settings-radio">
              <input type="radio" name="settings-theme" value="dark" ${theme === "dark" ? "checked" : ""}>
              ${t("settings.theme.dark")}
            </label>
            <label class="settings-radio">
              <input type="radio" name="settings-theme" value="system" ${theme === "system" ? "checked" : ""}>
              ${t("settings.theme.system")}
            </label>
          </div>
        </div>
      </div>
    </div>
  `;
}

function show(): void {
  const modal = document.getElementById("settings-modal")!;
  modal.innerHTML = buildModalHTML();
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Bind events
  document.getElementById("settings-close")!.addEventListener("click", hide);

  for (const radio of modal.querySelectorAll<HTMLInputElement>('input[name="settings-lang"]')) {
    radio.addEventListener("change", () => {
      if (radio.checked) setLocale(radio.value);
    });
  }

  for (const radio of modal.querySelectorAll<HTMLInputElement>('input[name="settings-theme"]')) {
    radio.addEventListener("change", () => {
      if (radio.checked) applyTheme(radio.value as Theme);
    });
  }
}

function hide(): void {
  const modal = document.getElementById("settings-modal")!;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

export function initSettings(): void {
  // Apply saved theme on load
  applyTheme(getStoredTheme());

  // Listen for system theme changes when in "system" mode
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });

  // Settings button
  document.getElementById("settings-btn")!.addEventListener("click", show);

  // Close on overlay click
  const modal = document.getElementById("settings-modal")!;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hide();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      hide();
    }
  });

  // Rebuild modal content when locale changes (if open)
  onLocaleChange(() => {
    if (!modal.classList.contains("hidden")) {
      modal.innerHTML = buildModalHTML();
      document.getElementById("settings-close")!.addEventListener("click", hide);

      for (const radio of modal.querySelectorAll<HTMLInputElement>('input[name="settings-lang"]')) {
        radio.addEventListener("change", () => {
          if (radio.checked) setLocale(radio.value);
        });
      }

      for (const radio of modal.querySelectorAll<HTMLInputElement>(
        'input[name="settings-theme"]',
      )) {
        radio.addEventListener("change", () => {
          if (radio.checked) applyTheme(radio.value as Theme);
        });
      }
    }
  });
}
