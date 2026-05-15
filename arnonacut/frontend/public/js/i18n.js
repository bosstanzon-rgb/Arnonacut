/* global window, document, fetch, localStorage, CustomEvent */
(function () {
  const SUPPORTED = ["en", "he", "ru", "fr"];
  const CACHE = new Map();
  let bundle = null;
  let locale = "en";

  function get(obj, path) {
    if (!obj || !path) return null;
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length; i += 1) {
      if (cur == null) return null;
      cur = cur[parts[i]];
    }
    return cur == null ? null : cur;
  }

  function interpolate(str, vars) {
    if (str == null || typeof str !== "string") return "";
    if (!vars || typeof vars !== "object") return str;
    return str.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] != null ? String(vars[k]) : `{${k}}`,
    );
  }

  function applyDocumentLocale(code) {
    const root = document.documentElement;
    root.lang = code;
    const rtl = code === "he" || code === "ar";
    root.dir = rtl ? "rtl" : "ltr";
  }

  async function loadLocale(code) {
    if (CACHE.has(code)) return CACHE.get(code);
    const url = `/lang/${code}.json`;
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok) throw new Error(`locale:${code}`);
    const json = await r.json();
    CACHE.set(code, json);
    return json;
  }

  async function setLocale(code) {
    const next = SUPPORTED.includes(code) ? code : "en";
    try {
      bundle = await loadLocale(next);
      locale = next;
    } catch {
      if (next !== "en") {
        bundle = await loadLocale("en");
        locale = "en";
      } else {
        bundle = {};
        locale = "en";
      }
    }
    applyDocumentLocale(locale);
    window.dispatchEvent(new CustomEvent("arnonacut:locale", { detail: { locale } }));
  }

  function t(key, vars) {
    const raw = get(bundle, key);
    if (raw == null) return key;
    return interpolate(String(raw), vars);
  }

  function getLocale() {
    return locale;
  }

  /** Whole shekels (₪) for kit price display */
  function formatIls(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "₪—";
    try {
      return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-IL", {
        style: "currency",
        currency: "ILS",
        maximumFractionDigits: 0,
      }).format(Math.round(n));
    } catch {
      return `₪${Math.round(n)}`;
    }
  }

  window.ArnonaI18n = {
    SUPPORTED,
    setLocale,
    getLocale,
    t,
    formatIls,
  };
})();
