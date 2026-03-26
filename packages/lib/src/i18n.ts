import ja from "./locales/ja";
import en from "./locales/en";

const messages: Record<string, Record<string, string>> = { ja, en };
export const supportedLocales = Object.keys(messages);

let currentLocale = "ja";

/** Get translated string. Supports parameter interpolation: t("key", { name: "X" }) */
export function t(key: string, params?: Record<string, string | number>): string {
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

export function setCurrentLocale(locale: string): void {
  if (supportedLocales.includes(locale)) currentLocale = locale;
}
