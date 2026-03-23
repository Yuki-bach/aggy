import ja from "../locales/ja";
import en from "../locales/en";

const STORAGE_KEY = "aggy-locale";
const messages: Record<string, Record<string, string>> = { ja, en };
const supportedLocales = Object.keys(messages);

let currentLocale = "ja";
let localeVersion = $state(0);

/** Get translated string. Supports parameter interpolation: t("key", { name: "X" }) */
export function t(key: string, params?: Record<string, string | number>): string {
  void localeVersion; // register reactive dependency
  let text = messages[currentLocale]?.[key] ?? messages["en"]?.[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function getLocale(): string {
  return currentLocale;
}

export function setLocale(locale: string): void {
  if (!supportedLocales.includes(locale)) return;
  if (locale === currentLocale) return;

  currentLocale = locale;
  localeVersion++;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  translateDOM();
}

/** Initialize i18n: detect locale from localStorage or browser setting */
export function initI18n(): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && supportedLocales.includes(saved)) {
    currentLocale = saved;
  } else {
    const browserLang = navigator.language.split("-")[0];
    currentLocale = supportedLocales.includes(browserLang) ? browserLang : "en";
  }
  document.documentElement.lang = currentLocale;
  translateDOM();
}

/**
 * Walk DOM and update elements with data-i18n attributes.
 * - data-i18n="key" → sets textContent
 * - data-i18n-html="key" → sets innerHTML (for content with HTML tags)
 * - data-i18n-attr="attrName" + data-i18n="key" → sets attribute value
 * - data-i18n-placeholder="key" → sets placeholder attribute
 */
function translateDOM(): void {
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset.i18n!;
    const attrName = el.dataset.i18nAttr;
    if (attrName) {
      el.setAttribute(attrName, t(key));
    } else {
      el.textContent = t(key);
    }
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n-html]")) {
    const key = el.dataset.i18nHtml!;
    el.innerHTML = t(key);
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]")) {
    const key = el.dataset.i18nPlaceholder!;
    (el as HTMLInputElement).placeholder = t(key);
  }
}
