import { t as coreT, getLocale, setCurrentLocale, supportedLocales } from "@aggy/lib/i18n";

export { getLocale };

const STORAGE_KEY = "aggy-locale";

let localeVersion = $state(0);

/** Get translated string (reactive wrapper for Svelte) */
export function t(key: string, params?: Record<string, string | number>): string {
  void localeVersion; // register reactive dependency
  return coreT(key, params);
}

export function setLocale(locale: string): void {
  if (!supportedLocales.includes(locale)) return;
  if (locale === getLocale()) return;

  setCurrentLocale(locale);
  localeVersion++;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  translateDOM();
}

/** Initialize i18n: detect locale from localStorage or browser setting */
export function initI18n(): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && supportedLocales.includes(saved)) {
    setCurrentLocale(saved);
  } else {
    const browserLang = navigator.language.split("-")[0];
    setCurrentLocale(supportedLocales.includes(browserLang) ? browserLang : "en");
  }
  document.documentElement.lang = getLocale();
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
      el.setAttribute(attrName, coreT(key));
    } else {
      el.textContent = coreT(key);
    }
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n-html]")) {
    const key = el.dataset.i18nHtml!;
    el.innerHTML = coreT(key);
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]")) {
    const key = el.dataset.i18nPlaceholder!;
    (el as HTMLInputElement).placeholder = coreT(key);
  }
}
