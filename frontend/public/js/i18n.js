/* global window */
(function () {
  const bundles = {};
  let locale = "en";

  function get(obj, path) {
    return path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
  }

  async function setLocale(next) {
    const want = String(next || "en")
      .trim()
      .slice(0, 8)
      .toLowerCase();
    let effective = want || "en";
    if (!bundles[effective]) {
      try {
        const res = await fetch(`/assets/lang/${effective}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("missing");
        bundles[effective] = await res.json();
      } catch {
        effective = "en";
        if (!bundles.en) {
          try {
            const r2 = await fetch("/assets/lang/en.json", { cache: "no-store" });
            bundles.en = r2.ok ? await r2.json() : { meta: { skipToContent: "Skip to content" } };
          } catch {
            bundles.en = { meta: { skipToContent: "Skip to content" } };
          }
        }
      }
    }
    locale = bundles[effective] ? effective : "en";
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
    document.body.classList.toggle("is-rtl", locale === "he");
    window.dispatchEvent(new CustomEvent("arnonacut:locale", { detail: { locale } }));
  }

  function t(path, vars) {
    const table = bundles[locale] || {};
    let s = get(table, path);
    if (s === undefined) s = path;
    if (vars && typeof s === "string") {
      return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
    }
    return s;
  }

  /** Format a NIS amount with locale-aware grouping (always ILS). */
  function formatIls(amount) {
    const n = typeof amount === "string" && amount.trim() !== "" ? Number(amount) : Number(amount);
    if (!Number.isFinite(n)) return "—";
    const locMap = { he: "he-IL", ru: "ru-RU", fr: "fr-FR", en: "en-IL" };
    const loc = locMap[locale] || "en-IL";
    try {
      return new Intl.NumberFormat(loc, {
        style: "currency",
        currency: "ILS",
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
      }).format(n);
    } catch {
      return `₪${n.toLocaleString("he-IL", { maximumFractionDigits: 2 })}`;
    }
  }

  window.ArnonaI18n = { setLocale, t, getLocale: () => locale, formatIls };
})();
