(() => {
  "use strict";

  const root = document.documentElement;
  const toggle = document.getElementById("theme-toggle");
  const label = toggle?.querySelector(".theme-toggle-label");
  const storageKey = "boseong-cv-theme";

  const readSavedTheme = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const saveTheme = (theme) => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // The theme still works when browser storage is unavailable.
    }
  };

  const updateToggle = (theme) => {
    if (!toggle || !label) return;

    const isDark = theme === "dark";
    toggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    toggle.setAttribute("aria-pressed", String(!isDark));
    label.textContent = isDark ? "Light" : "Dark";
  };

  const applyTheme = (theme, persist = false) => {
    const nextTheme = theme === "light" ? "light" : "dark";
    root.dataset.theme = nextTheme;
    updateToggle(nextTheme);

    if (persist) saveTheme(nextTheme);
  };

  // Dark mode is the default. A previously selected light theme is restored.
  applyTheme(readSavedTheme() === "light" ? "light" : "dark");

  toggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  requestAnimationFrame(() => root.classList.add("theme-ready"));
})();
