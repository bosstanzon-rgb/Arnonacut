/* global window, document, fetch, localStorage */
(function () {
  const API_V1 = `${window.location.origin}/api/v1`;
  const KIT_PRICE = 99;
  const PROGRESS_KEY = "arnonacut_progress_v4";
  const PREMIUM_KEY = "arnonacut_premium_v1";
  const SUPPORTED = ["en", "he", "ru", "fr"];

  function $(id) {
    return document.getElementById(id);
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      return o && o.v === 4 ? o : null;
    } catch {
      return null;
    }
  }

  function savePremiumAndProgress(orderId, accessToken, kitUrls) {
    const rec = {
      v: 1,
      orderId,
      accessToken,
      kitUrls,
      status: "paid",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PREMIUM_KEY, JSON.stringify(rec));
    const progress = loadProgress();
    if (progress) {
      progress.accessToken = accessToken;
      progress.kitUrls = kitUrls;
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    }
  }

  function buildLangBar() {
    const bar = $("checkout-lang-bar");
    if (!bar || !window.ArnonaI18n) return;
    bar.innerHTML = "";
    const labels = { en: "EN", he: "עב", ru: "RU", fr: "FR" };
    SUPPORTED.forEach((code) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.locale = code;
      b.textContent = labels[code] || code.toUpperCase();
      b.className =
        "rounded-full border border-transparent px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 " +
        (window.ArnonaI18n.getLocale() === code
          ? "border-brand-200/80 bg-white text-brand-800 shadow-md ring-1 ring-brand-100"
          : "text-slate-600 hover:border-slate-200 hover:bg-white/80 hover:text-slate-900");
      b.addEventListener("click", async () => {
        await window.ArnonaI18n.setLocale(code);
        localStorage.setItem("arnonacut_locale", code);
        buildLangBar();
        applyCheckoutI18n();
      });
      bar.appendChild(b);
    });
  }

  function applyCheckoutI18n() {
    if (!window.ArnonaI18n) return;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = window.ArnonaI18n.t(key);
    });
    const fp = window.ArnonaI18n.formatIls(KIT_PRICE);
    const hero = $("checkout-price-hero");
    if (hero) hero.textContent = window.ArnonaI18n.t("checkout.priceHero", { price: fp });
    const kitLabel = $("checkout-kit-label");
    if (kitLabel) kitLabel.textContent = window.ArnonaI18n.t("checkout.kitLabel");
    const payBtn = $("checkout-pay-btn");
    if (payBtn) payBtn.textContent = window.ArnonaI18n.t("checkout.cta", { price: fp });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (!key) return;
      el.setAttribute("aria-label", window.ArnonaI18n.t(key));
    });
    window.ArnonaLegal?.renderInto($("checkout-legal-full-body"));
  }

  async function runCheckout() {
    const errEl = $("checkout-error");
    const btn = $("checkout-pay-btn");
    errEl?.classList.add("hidden");
    const progress = loadProgress();
    if (!progress || !progress.sessionId) {
      errEl.textContent = window.ArnonaI18n.t("checkout.missingSession");
      errEl.classList.remove("hidden");
      return;
    }
    const form = progress.form || {};
    const old = btn.textContent;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.textContent = window.ArnonaI18n.t("checkout.busy");
    try {
      const r1 = await fetch(`${API_V1}/orders/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: progress.sessionId,
          customer_profile: {
            city_id: form.city_id,
            household_size: form.household_size,
            gross_monthly_income_nis: form.gross_monthly_income_nis,
            apartment_sqm: form.apartment_sqm,
            special_statuses: form.special_statuses || [],
            rules_year: form.rules_year || 2026,
          },
        }),
      });
      if (!r1.ok) {
        if (r1.status === 429) {
          errEl.textContent = window.ArnonaI18n.t("errors.rateLimit");
          errEl.classList.remove("hidden");
          return;
        }
        throw new Error("order");
      }
      const order = await r1.json();
      const r2 = await fetch(`${API_V1}/payments/placeholder/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.order_id }),
      });
      if (!r2.ok) {
        if (r2.status === 429) {
          errEl.textContent = window.ArnonaI18n.t("errors.rateLimit");
          errEl.classList.remove("hidden");
          return;
        }
        throw new Error("pay");
      }
      const paid = await r2.json();
      savePremiumAndProgress(order.order_id, paid.access_token, paid.kit_urls);
      window.location.href = "/?kit=1";
    } catch (e) {
      const msg = String(e && e.message ? e.message : "");
      const net =
        e instanceof TypeError ||
        (typeof e === "object" && e && e.name === "AbortError") ||
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("network");
      errEl.textContent = window.ArnonaI18n.t(net ? "checkout.errorNetwork" : "checkout.error");
      errEl.classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.removeAttribute("aria-busy");
      btn.textContent = old;
    }
  }

  async function boot() {
    let loc = localStorage.getItem("arnonacut_locale");
    if (!SUPPORTED.includes(loc)) {
      const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
      loc = SUPPORTED.includes(nav) ? nav : "en";
    }
    await window.ArnonaI18n.setLocale(loc);
    buildLangBar();
    applyCheckoutI18n();
    $("checkout-pay-btn")?.addEventListener("click", runCheckout);
    window.addEventListener("arnonacut:locale", () => {
      buildLangBar();
      applyCheckoutI18n();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
