(() => {
  const storageKey = "aggy-locale";
  const requested = new URLSearchParams(window.location.search).get("lang");
  const requestedIsSupported = requested === "ja" || requested === "en";

  let saved = null;
  try {
    if (requestedIsSupported) {
      localStorage.setItem(storageKey, requested);
    }
    const stored = localStorage.getItem(storageKey);
    saved = stored === "ja" || stored === "en" ? stored : null;
  } catch {
    // Language detection still works when browser storage is unavailable.
  }

  const browserLocale = navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
  const preferred = requestedIsSupported ? requested : saved || browserLocale;

  if (document.documentElement.lang === "ja" && preferred === "en") {
    window.location.replace(new URL(`en/${window.location.hash}`, window.location.href).href);
  }
})();
