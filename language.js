(() => {
  "use strict";

  const dictionaries = window.siteTranslations;
  if (!dictionaries) return;

  const storageKey = "boseong-cv-language";
  const root = document.documentElement;
  const toggle = document.getElementById("language-toggle");
  let language = "ko";

  try {
    if (localStorage.getItem(storageKey) === "en") language = "en";
  } catch {
    // Switching still works when browser storage is unavailable.
  }

  const translate = (key) => dictionaries[language][key] ?? dictionaries.ko[key] ?? key;

  const applyLanguage = (next, persist = false) => {
    language = next === "en" ? "en" : "ko";
    root.lang = language;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      // Only trusted, repository-authored translations contain markup.
      element.innerHTML = translate(element.dataset.i18nHtml);
    });
    ["content", "alt", "title", "aria-label"].forEach((attribute) => {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach((element) => {
        element.setAttribute(attribute, translate(element.getAttribute(`data-i18n-${attribute}`)));
      });
    });

    if (toggle) {
      const target = language === "ko" ? "en" : "ko";
      toggle.lang = target;
      toggle.textContent = target === "en" ? "English" : "한국어";
      toggle.setAttribute("aria-label", target === "en" ? "Switch to English" : "한국어로 전환");
      toggle.hidden = false;
    }

    if (persist) {
      try {
        localStorage.setItem(storageKey, language);
      } catch {
        // The current page can still use the selected language.
      }
    }
    document.dispatchEvent(new CustomEvent("site-language-change", { detail: { language } }));
  };

  window.siteLanguage = {
    get language() { return language; },
    translate,
    setLanguage: (value) => applyLanguage(value, true)
  };

  toggle?.addEventListener("click", () => applyLanguage(language === "ko" ? "en" : "ko", true));
  applyLanguage(language);
})();
