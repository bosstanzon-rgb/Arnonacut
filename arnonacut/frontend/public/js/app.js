/* global window, document, fetch */
/* ArnonaCut app — results + quiz bundle (saved 2026-05-14) */
(function () {
  const API_V1 = `${window.location.origin}/api/v1`;
  const API_ROOT = `${window.location.origin}/api`;
  const KIT_PRICE = 99;
  /** When illustrative annual savings (high bound) exceeds this, the results UI nudges more strongly toward Pro. */
  const HIGH_SAVINGS_THRESHOLD_ILS = 1500;
  const SUPPORTED = ["en", "he", "ru", "fr"];
  const STORAGE_KEY = "arnonacut_progress_v4";
  const PREMIUM_KEY = "arnonacut_premium_v1";
  const STEPS = 5;

  /** @type {{ view: string, step: number, form: Record<string, any>, lastCalc: any, sessionId: string | null, accessToken: string | null, orderId: string | null, kitUrls: Record<string,string> | null, kitUnlocked: boolean, citiesCatalog: any[] | null, catalog: any[] | null }} */
  const state = {
    view: "landing",
    step: 0,
    form: {
      city_id: "",
      household_size: 2,
      gross_monthly_income_nis: "",
      apartment_sqm: "",
      special_statuses: [],
      rules_year: 2026,
    },
    lastCalc: null,
    sessionId: null,
    accessToken: null,
    orderId: null,
    kitUrls: null,
    kitUnlocked: false,
    citiesCatalog: null,
    catalog: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function showView(name) {
    state.view = name;
    ["landing", "quiz", "results", "success"].forEach((v) => {
      const el = $(`view-${v}`);
      if (!el) return;
      el.classList.toggle("hidden", v !== name);
    });
    persist();
    syncResultsHighSavingsUi();
  }

  function persist() {
    try {
      const payload = {
        v: 4,
        view: state.view,
        step: state.step,
        form: { ...state.form, special_statuses: [...(state.form.special_statuses || [])] },
        lastCalc: state.lastCalc,
        sessionId: state.sessionId,
        accessToken: state.accessToken,
        kitUrls: state.kitUrls,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (state.accessToken && state.kitUrls && state.kitUnlocked) {
        const pr = {
          v: 1,
          orderId: state.orderId,
          accessToken: state.accessToken,
          kitUrls: state.kitUrls,
          status: "paid",
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(PREMIUM_KEY, JSON.stringify(pr));
      }
    } catch {
      /* ignore quota */
    }
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (o.v !== 4) return null;
      return o;
    } catch {
      return null;
    }
  }

  function clampStep(n) {
    const x = Math.floor(Number(n));
    if (!Number.isFinite(x)) return 0;
    return Math.min(STEPS - 1, Math.max(0, x));
  }

  function lastCalcLooksValid(c) {
    return (
      c &&
      typeof c === "object" &&
      typeof c.city_id === "string" &&
      typeof c.estimate_min_pct === "number" &&
      typeof c.estimate_max_pct === "number" &&
      Number.isFinite(c.estimate_min_pct) &&
      Number.isFinite(c.estimate_max_pct)
    );
  }

  function sanitizePersistedForm(form) {
    const src = form && typeof form === "object" ? form : {};
    const ry = Math.min(2035, Math.max(2024, parseInt(String(src.rules_year), 10) || 2026));
    const hh = Math.min(30, Math.max(1, parseInt(String(src.household_size), 10) || 2));
    const inc = src.gross_monthly_income_nis;
    const incN = inc === "" || inc === undefined || inc === null ? "" : Number(inc);
    const sqm = src.apartment_sqm;
    const sqmN = sqm === "" || sqm === undefined || sqm === null ? "" : Number(sqm);
    const rawStatuses = Array.isArray(src.special_statuses) ? src.special_statuses : [];
    const special_statuses = [];
    const seen = new Set();
    for (let i = 0; i < rawStatuses.length && special_statuses.length < 24; i += 1) {
      const c = rawStatuses[i];
      if (typeof c !== "string") continue;
      const code = c.trim().slice(0, 64);
      if (!code || seen.has(code)) continue;
      if (!/^[\w.-]+$/.test(code)) continue;
      seen.add(code);
      special_statuses.push(code);
    }
    return {
      city_id: typeof src.city_id === "string" ? src.city_id.trim().slice(0, 64) : "",
      household_size: hh,
      gross_monthly_income_nis: Number.isFinite(incN) && incN >= 0 ? incN : "",
      apartment_sqm: Number.isFinite(sqmN) && sqmN > 0 ? sqmN : "",
      special_statuses,
      rules_year: ry,
    };
  }

  function applySaved(o) {
    state.view = o.view || "landing";
    if (state.view === "paywall") state.view = "results";
    state.step = clampStep(o.step);
    state.form = sanitizePersistedForm(o.form);
    state.lastCalc = lastCalcLooksValid(o.lastCalc) ? o.lastCalc : null;
    const sid = typeof o.sessionId === "string" ? o.sessionId.trim() : "";
    state.sessionId = sid.length >= 32 && sid.length <= 40 ? sid : null;
    const tok = typeof o.accessToken === "string" ? o.accessToken.trim() : "";
    state.accessToken = tok.length >= 20 && tok.length <= 256 ? tok : null;
    const ku = o.kitUrls;
    state.kitUrls =
      ku &&
      typeof ku === "object" &&
      typeof ku.checklist_pdf === "string" &&
      typeof ku.templates_zip === "string"
        ? { checklist_pdf: ku.checklist_pdf, templates_zip: ku.templates_zip }
        : null;
  }

  function loadPremiumRecord() {
    try {
      const raw = localStorage.getItem(PREMIUM_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      return p && p.v === 1 ? p : null;
    } catch {
      return null;
    }
  }

  function mergePremiumFromDisk() {
    const p = loadPremiumRecord();
    if (!p || !p.accessToken) return;
    state.accessToken = p.accessToken;
    state.kitUrls = p.kitUrls || null;
    state.orderId = p.orderId || null;
  }

  function clearPremiumStorage() {
    localStorage.removeItem(PREMIUM_KEY);
    state.accessToken = null;
    state.kitUrls = null;
    state.orderId = null;
    state.kitUnlocked = false;
  }

  async function refreshPremiumFromServer() {
    if (!state.accessToken) {
      state.kitUnlocked = false;
      return;
    }
    try {
      const r = await fetch(`${API_V1}/kit/${encodeURIComponent(state.accessToken)}/meta`);
      if (r.status === 429) return;
      if (!r.ok) throw new Error("meta");
      const m = await r.json();
      if (m.valid && m.checklist_pdf && m.templates_zip) {
        state.kitUnlocked = true;
        state.kitUrls = {
          checklist_pdf: m.checklist_pdf,
          templates_zip: m.templates_zip,
        };
        persist();
      } else {
        state.kitUnlocked = false;
        clearPremiumStorage();
        persist();
      }
    } catch {
      state.kitUnlocked = !!(state.kitUrls && state.accessToken);
    }
  }

  function renderResultsKitState() {
    const locked = $("results-kit-locked");
    const unlocked = $("results-kit-unlocked");
    if (!locked || !unlocked) return;
    const t = window.ArnonaI18n.t.bind(window.ArnonaI18n);
    if (state.kitUnlocked && state.kitUrls) {
      locked.classList.add("hidden");
      unlocked.classList.remove("hidden");
      $("results-kit-title-open").textContent = t("results.kitUnlockedTitle");
      $("results-kit-sub-open").textContent = t("results.kitUnlockedSub");
      const origin = window.location.origin;
      const pdf = $("results-link-pdf");
      const zip = $("results-link-zip");
      if (pdf) {
        pdf.href = `${origin}${state.kitUrls.checklist_pdf}`;
        pdf.textContent = t("results.kitDownloadPdf");
      }
      if (zip) {
        zip.href = `${origin}${state.kitUrls.templates_zip}`;
        zip.textContent = t("results.kitDownloadZip");
      }
    } else {
      unlocked.classList.add("hidden");
      locked.classList.remove("hidden");
      const cta = $("results-btn-checkout");
      const ctaLabel = $("results-btn-checkout-label");
      const price = window.ArnonaI18n.formatIls(KIT_PRICE);
      const ctaKey = resultsHighSavingsActive() ? "results.proCtaHigh" : "results.proCta";
      if (ctaLabel) ctaLabel.textContent = t(ctaKey, { price });
      else if (cta) cta.textContent = t(ctaKey, { price });
      if (cta) {
        cta.setAttribute("href", "/checkout.html");
        cta.setAttribute("aria-label", t("results.proCtaAria"));
      }
    }
  }

  function clearProgress() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREMIUM_KEY);
    state.view = "landing";
    state.step = 0;
    state.form = {
      city_id: "",
      household_size: 2,
      gross_monthly_income_nis: "",
      apartment_sqm: "",
      special_statuses: [],
      rules_year: 2026,
    };
    state.lastCalc = null;
    state.sessionId = null;
    state.accessToken = null;
    state.orderId = null;
    state.kitUrls = null;
    state.kitUnlocked = false;
    syncResultsHighSavingsUi();
  }

  function applyStaticI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const varsRaw = el.getAttribute("data-i18n-vars");
      let vars;
      if (varsRaw) {
        try {
          vars = JSON.parse(varsRaw);
        } catch {
          vars = undefined;
        }
      }
      el.textContent = window.ArnonaI18n.t(key, vars);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria");
      if (!key) return;
      el.setAttribute("aria-label", window.ArnonaI18n.t(key));
    });
    window.ArnonaLegal?.renderInto($("results-legal-full-body"));
    window.ArnonaLegal?.renderInto($("success-legal-full-body"));
  }

  function setProgressUI() {
    const pct = ((state.step + 1) / STEPS) * 100;
    const bar = $("quiz-progress-bar");
    const wrap = $("quiz-progress-wrap");
    if (bar) {
      bar.style.width = `${pct}%`;
      bar.style.transition = "width 900ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
    if (wrap) {
      wrap.setAttribute("aria-valuenow", String(state.step + 1));
      wrap.setAttribute("aria-valuetext", window.ArnonaI18n.t("wizard.stepOf", { n: String(state.step + 1), total: String(STEPS) }));
    }
    const lab = $("quiz-step-label");
    if (lab) lab.textContent = window.ArnonaI18n.t("wizard.stepOf", { n: String(state.step + 1), total: String(STEPS) });
    const fr = $("quiz-fraction");
    if (fr) fr.textContent = `${state.step + 1}/${STEPS}`;
  }

  async function ensureCities() {
    if (state.citiesCatalog) return;
    const res = await fetch(`${API_ROOT}/cities?rules_year=${state.form.rules_year}`);
    if (!res.ok) throw new Error("cities");
    const data = await res.json();
    state.citiesCatalog = data.cities || [];
  }

  function statusLabel(code) {
    const loc = window.ArnonaI18n.getLocale();
    const cat = (state.catalog || []).find((c) => c.code === code);
    if (!cat) return code;
    if (loc === "he" && cat.label_he) return cat.label_he;
    return cat.label_en || code;
  }

  async function ensureCatalog() {
    if (state.catalog) return;
    const res = await fetch(`${API_ROOT}/cities?rules_year=${state.form.rules_year}`);
    if (!res.ok) return;
    const data = await res.json();
    state.catalog = data.special_status_catalog || [];
  }

  function renderQuiz() {
    setProgressUI();
    const title = $("quiz-title");
    const hint = $("quiz-hint");
    const voice = $("quiz-voice");
    const body = $("quiz-body");
    const card = $("quiz-card");
    if (!title || !hint || !body) return;

    if (card) {
      card.classList.remove("animate-fade-up");
      void card.offsetWidth;
      card.classList.add("opacity-0-start", "animate-fade-up", "animate-fill-mode-forwards");
    }

    const s = state.step;
    body.innerHTML = "";
    if (voice) {
      const line = window.ArnonaI18n.t(`wizard.conversational.${s}`);
      voice.textContent = line.startsWith("wizard.conversational.") ? "" : line;
    }

    if (s === 0) {
      title.textContent = window.ArnonaI18n.t("wizard.steps.0.title");
      hint.textContent = window.ArnonaI18n.t("wizard.steps.0.hint");
      if (!state.citiesCatalog || !state.citiesCatalog.length) {
        body.innerHTML = `
          <div class="space-y-3" role="status" aria-live="polite" aria-busy="true">
            <p class="text-sm font-medium text-slate-600">${window.ArnonaI18n.t("wizard.city.loading")}</p>
            <div class="space-y-2">
              ${[1, 2, 3, 4, 5]
                .map(
                  () =>
                    `<div class="h-14 animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%]"></div>`,
                )
                .join("")}
            </div>
          </div>`;
        ensureCities()
          .then(() => renderQuiz())
          .catch(() => {
            body.innerHTML = `
              <div class="rounded-2xl border border-rose-200/90 bg-rose-50/90 p-4 text-sm text-rose-900 shadow-sm" role="alert">
                <p class="font-semibold">${window.ArnonaI18n.t("wizard.city.errorTitle")}</p>
                <p class="mt-2 leading-relaxed text-rose-900/90">${window.ArnonaI18n.t("wizard.city.error")}</p>
              </div>`;
          });
        return;
      }
      state.citiesCatalog.forEach((c) => {
        const id = c.id;
        const label = (c.names && (window.ArnonaI18n.getLocale() === "he" ? c.names.he : c.names.en)) || id;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "w-full rounded-2xl border px-4 py-4 text-start text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99] " +
          (state.form.city_id === id
            ? "border-brand-400 bg-gradient-to-br from-brand-50 to-white text-brand-950 ring-2 ring-brand-200/90 shadow-md"
            : "border-slate-200/90 bg-white text-slate-900 hover:border-brand-200 hover:bg-brand-50/40");
        btn.textContent = label;
        btn.addEventListener("click", () => {
          state.form.city_id = id;
          renderQuiz();
        });
        body.appendChild(btn);
      });
    } else if (s === 1) {
      title.textContent = window.ArnonaI18n.t("wizard.steps.1.title");
      hint.textContent = window.ArnonaI18n.t("wizard.steps.1.hint");
      const wrap = document.createElement("div");
      wrap.className = "space-y-2";
      wrap.innerHTML = `
        <label class="block text-sm font-medium text-slate-700" for="inp-household">${window.ArnonaI18n.t("wizard.steps.1.label")}</label>
        <input id="inp-household" type="number" inputmode="numeric" min="1" max="30" step="1"
          class="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-4 text-lg font-semibold tabular-nums text-slate-900 shadow-inner outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20" />
      `;
      body.appendChild(wrap);
      const inp = $("inp-household");
      inp.setAttribute("enterkeyhint", "next");
      inp.setAttribute("autocomplete", "off");
      inp.value = String(state.form.household_size || 2);
      inp.addEventListener("input", () => {
        state.form.household_size = Math.max(1, Math.min(30, parseInt(inp.value, 10) || 1));
      });
    } else if (s === 2) {
      title.textContent = window.ArnonaI18n.t("wizard.steps.2.title");
      hint.textContent = window.ArnonaI18n.t("wizard.steps.2.hint");
      const wrap = document.createElement("div");
      wrap.className = "space-y-2";
      wrap.innerHTML = `
        <label class="block text-sm font-medium text-slate-700" for="inp-income">${window.ArnonaI18n.t("wizard.steps.2.label")}</label>
        <input id="inp-income" type="number" inputmode="decimal" min="0" step="100"
          placeholder="${window.ArnonaI18n.t("wizard.steps.2.placeholder")}"
          class="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-4 text-lg font-semibold tabular-nums text-slate-900 shadow-inner outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20" />
        <p class="text-xs text-slate-500">${window.ArnonaI18n.t("wizard.steps.2.helper")}</p>
      `;
      body.appendChild(wrap);
      const inp = $("inp-income");
      inp.setAttribute("enterkeyhint", "next");
      inp.setAttribute("autocomplete", "off");
      inp.value = state.form.gross_monthly_income_nis === "" ? "" : String(state.form.gross_monthly_income_nis);
      inp.addEventListener("input", () => {
        const v = parseFloat(inp.value);
        state.form.gross_monthly_income_nis = Number.isFinite(v) ? v : "";
      });
    } else if (s === 3) {
      title.textContent = window.ArnonaI18n.t("wizard.steps.3.title");
      hint.textContent = window.ArnonaI18n.t("wizard.steps.3.hint");
      ensureCatalog()
        .then(() => {
          body.innerHTML = "";
          const sub = document.createElement("p");
          sub.className = "mb-3 text-xs font-medium uppercase tracking-wide text-slate-500";
          sub.textContent = window.ArnonaI18n.t("wizard.steps.3.sub");
          body.appendChild(sub);
          const grid = document.createElement("div");
          grid.className = "flex flex-wrap gap-2";
          (state.catalog || []).forEach((item) => {
            const code = item.code;
            const on = state.form.special_statuses.includes(code);
            const chip = document.createElement("button");
            chip.type = "button";
            chip.setAttribute("aria-pressed", on ? "true" : "false");
            chip.className =
              "rounded-full border px-4 py-2.5 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 " +
              (on
                ? "border-forest-500 bg-gradient-to-r from-forest-600 to-forest-500 text-white shadow-md"
                : "border-slate-200/90 bg-white text-slate-800 hover:border-brand-200 hover:bg-brand-50/50");
            chip.textContent = statusLabel(code);
            chip.addEventListener("click", () => {
              const set = new Set(state.form.special_statuses);
              if (set.has(code)) set.delete(code);
              else set.add(code);
              state.form.special_statuses = Array.from(set);
              renderQuiz();
            });
            grid.appendChild(chip);
          });
          body.appendChild(grid);
          const skip = document.createElement("p");
          skip.className = "mt-4 text-xs text-slate-500";
          skip.textContent = window.ArnonaI18n.t("wizard.steps.3.skipNote");
          body.appendChild(skip);
        })
        .catch(() => {
          body.innerHTML = `
            <div class="rounded-2xl border border-rose-200/90 bg-rose-50/90 p-4 text-sm text-rose-900 shadow-sm" role="alert">
              <p class="font-semibold">${window.ArnonaI18n.t("wizard.city.errorTitle")}</p>
              <p class="mt-2 leading-relaxed text-rose-900/90">${window.ArnonaI18n.t("wizard.catalogError")}</p>
            </div>`;
        });
    } else if (s === 4) {
      title.textContent = window.ArnonaI18n.t("wizard.steps.4.title");
      hint.textContent = window.ArnonaI18n.t("wizard.steps.4.hint");
      const wrap = document.createElement("div");
      wrap.className = "space-y-2";
      wrap.innerHTML = `
        <label class="block text-sm font-medium text-slate-700" for="inp-sqm">${window.ArnonaI18n.t("wizard.steps.4.label")}</label>
        <input id="inp-sqm" type="number" inputmode="decimal" min="1" max="5000" step="1"
          placeholder="${window.ArnonaI18n.t("wizard.steps.4.placeholder")}"
          class="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-4 text-lg font-semibold tabular-nums text-slate-900 shadow-inner outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-400/20" />
      `;
      body.appendChild(wrap);
      const inp = $("inp-sqm");
      inp.setAttribute("enterkeyhint", "done");
      inp.setAttribute("autocomplete", "off");
      inp.value = state.form.apartment_sqm === "" ? "" : String(state.form.apartment_sqm);
      inp.addEventListener("input", () => {
        const v = parseFloat(inp.value);
        state.form.apartment_sqm = Number.isFinite(v) ? v : "";
      });
    }

    const nextBtn = $("btn-quiz-next");
    const atEnd = state.step === STEPS - 1;
    if (nextBtn) nextBtn.textContent = window.ArnonaI18n.t(atEnd ? "wizard.finish" : "wizard.next");

    const backBtn = $("btn-quiz-back");
    if (backBtn) {
      backBtn.disabled = state.step === 0;
      backBtn.classList.toggle("opacity-40", state.step === 0);
    }
    persist();
  }

  function validateStep() {
    const s = state.step;
    if (s === 0 && !state.form.city_id) {
      flashInvalid($("quiz-title"));
      return window.ArnonaI18n.t("wizard.validation.city");
    }
    if (s === 1) {
      const n = parseInt(String(state.form.household_size), 10);
      if (!n || n < 1) {
        flashInvalid($("quiz-title"));
        return window.ArnonaI18n.t("wizard.validation.household");
      }
      state.form.household_size = n;
    }
    if (s === 2) {
      const v = parseFloat(String(state.form.gross_monthly_income_nis));
      if (!Number.isFinite(v) || v < 0) {
        flashInvalid($("quiz-title"));
        return window.ArnonaI18n.t("wizard.validation.income");
      }
      state.form.gross_monthly_income_nis = v;
    }
    if (s === 4) {
      const v = parseFloat(String(state.form.apartment_sqm));
      if (!Number.isFinite(v) || v <= 0) {
        flashInvalid($("quiz-title"));
        return window.ArnonaI18n.t("wizard.validation.sqm");
      }
      state.form.apartment_sqm = v;
    }
    return null;
  }

  function flashInvalid(el) {
    if (!el) return;
    el.classList.add("ring-2", "ring-red-300");
    window.setTimeout(() => el.classList.remove("ring-2", "ring-red-300"), 500);
  }

  function quizAnswersForSession() {
    const inc = Number(state.form.gross_monthly_income_nis) || 0;
    const st = state.form.special_statuses || [];
    return [
      { question_id: "q1", value: "owner_occupied" },
      { question_id: "q2", value: st.length ? "yes_documented" : "no" },
      { question_id: "q3", value: inc < 18000 ? "jumped" : "stable" },
      { question_id: "q4", value: "some" },
      { question_id: "q5", value: "need_help" },
    ];
  }

  async function submitWizard() {
    const payload = {
      city_id: state.form.city_id,
      household_size: state.form.household_size,
      gross_monthly_income_nis: Number(state.form.gross_monthly_income_nis),
      apartment_sqm: Number(state.form.apartment_sqm),
      special_statuses: state.form.special_statuses || [],
      rules_year: state.form.rules_year,
    };
    let res;
    try {
      res = await fetch(`${API_ROOT}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      showToast(window.ArnonaI18n.t("errors.network"));
      throw new Error("network");
    }
    if (res.status === 429) {
      showToast(window.ArnonaI18n.t("errors.rateLimit"));
      return;
    }
    if (!res.ok) {
      showToast(window.ArnonaI18n.t("results.calculateError"));
      return;
    }
    let data;
    try {
      data = await res.json();
    } catch {
      showToast(window.ArnonaI18n.t("results.calculateError"));
      return;
    }
    state.lastCalc = data;

    let qres;
    try {
      qres = await fetch(`${API_V1}/quiz/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: window.ArnonaI18n.getLocale(),
          answers: quizAnswersForSession(),
        }),
      });
    } catch {
      showToast(window.ArnonaI18n.t("errors.network"));
      state.sessionId = null;
      persist();
      await refreshPremiumFromServer();
      showView("results");
      renderResultsAnimated();
      return;
    }
    if (!qres.ok) {
      if (qres.status === 429) showToast(window.ArnonaI18n.t("errors.rateLimit"));
      else if (qres.status >= 500) showToast(window.ArnonaI18n.t("errors.network"));
      state.sessionId = null;
    } else {
      try {
        const qd = await qres.json();
        if (qd && typeof qd.session_id === "string") state.sessionId = qd.session_id;
        else state.sessionId = null;
      } catch {
        state.sessionId = null;
      }
    }

    persist();
    await refreshPremiumFromServer();
    showView("results");
    renderResultsAnimated();
  }

  function showToast(msg) {
    let el = $("toast-arnona");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast-arnona";
      el.className =
        "fixed bottom-6 left-1/2 z-[200] max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3 text-center text-sm text-white shadow-premium backdrop-blur-sm hidden";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove("hidden");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => el.classList.add("hidden"), 3200);
  }

  function countUp(el, target, duration) {
    if (!el) return;
    const start = performance.now();
    const tgt = Number(target);
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const val = tgt * ease;
      el.textContent = val.toFixed(2);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = tgt.toFixed(2);
    }
    requestAnimationFrame(frame);
  }

  /** Rough placeholder annual liability for illustrative ₪ savings band — not a bill estimate. */
  function illustrativeAnnualArnonaProxyNis() {
    const sqm = Number(state.form.apartment_sqm);
    if (!Number.isFinite(sqm) || sqm <= 0) return null;
    const hh = Math.min(6, Math.max(1, parseInt(String(state.form.household_size), 10) || 1));
    return Math.round(Math.max(4200, sqm * 52 * (1 + hh * 0.035)));
  }

  /** High end of illustrative annual savings band (NIS), or null if inputs missing. */
  function illustrativeAnnualSavingsHighBoundNis() {
    const c = state.lastCalc;
    const proxy = illustrativeAnnualArnonaProxyNis();
    if (!c || !proxy) return null;
    const maxPct = Number(c.estimate_max_pct) / 100;
    if (!Number.isFinite(maxPct)) return null;
    return Math.round(proxy * maxPct);
  }

  function resultsHighSavingsActive() {
    const hi = illustrativeAnnualSavingsHighBoundNis();
    return hi != null && hi > HIGH_SAVINGS_THRESHOLD_ILS;
  }

  function syncResultsHighSavingsUi() {
    const kitCard = $("results-kit-card");
    const proCol = $("results-pro-column");
    const nudge = $("results-high-savings-nudge");
    const cta = $("results-btn-checkout");
    const onResults = state.view === "results";
    const active = onResults && resultsHighSavingsActive();

    if (nudge) nudge.classList.toggle("hidden", !active);

    const kitExtras = ["ring-2", "ring-emerald-400/45"];
    if (kitCard) kitExtras.forEach((cls) => kitCard.classList.toggle(cls, active));

    const proExtras = ["outline", "outline-2", "outline-offset-2", "outline-emerald-400/90"];
    if (proCol) proExtras.forEach((cls) => proCol.classList.toggle(cls, active));

    const ctaExtras = ["shadow-[0_0_28px_rgba(16,185,129,0.45)]", "ring-2", "ring-emerald-200/90"];
    if (cta) ctaExtras.forEach((cls) => cta.classList.toggle(cls, active));
  }

  function playConfetti(intensity) {
    const root = $("results-confetti");
    if (!root) return;
    if (playConfetti._clearTimer) {
      window.clearTimeout(playConfetti._clearTimer);
      playConfetti._clearTimer = null;
    }
    root.innerHTML = "";
    const n = intensity === "high" ? 32 : 18;
    const colors = ["#14b8a6", "#10b981", "#0038b8", "#fbbf24", "#e2e8f0"];
    for (let i = 0; i < n; i += 1) {
      const el = document.createElement("span");
      const drift = `${(Math.random() - 0.5) * 90}px`;
      el.style.setProperty("--tw-drift", drift);
      el.className = "confetti-piece animate-confetti-fall";
      el.style.left = `${8 + Math.random() * 84}%`;
      el.style.top = "-6%";
      el.style.backgroundColor = colors[i % colors.length];
      el.style.animationDelay = `${Math.random() * 0.35}s`;
      el.style.animationDuration = `${2.2 + Math.random() * 1.2}s`;
      root.appendChild(el);
    }
    playConfetti._clearTimer = window.setTimeout(() => {
      root.innerHTML = "";
      playConfetti._clearTimer = null;
    }, 4000);
  }

  function renderResultsAnimated() {
    const c = state.lastCalc;
    if (!c) return;
    const minEl = $("results-min");
    const maxEl = $("results-max");
    const disc = $("results-disclaimer-api");
    if (disc) disc.textContent = c.disclaimer || "";

    const hero = $("results-hero");
    if (hero) {
      hero.classList.remove("animate-scale-in");
      void hero.offsetWidth;
      hero.classList.add("opacity-0-start", "animate-scale-in", "animate-fill-mode-forwards");
    }

    const proxy = illustrativeAnnualArnonaProxyNis();
    const saveBlock = $("results-savings-block");
    const saveHead = $("results-savings-headline");
    const saveRange = $("results-savings-range");
    const saveNote = $("results-savings-note");
    let confettiIntensity = "low";
    if (proxy && saveBlock && saveHead && saveRange && saveNote) {
      const minPct = Number(c.estimate_min_pct) / 100;
      const maxPct = Number(c.estimate_max_pct) / 100;
      const low = Math.round(proxy * minPct);
      const high = Math.round(proxy * maxPct);
      const fmt = window.ArnonaI18n.formatIls.bind(window.ArnonaI18n);
      saveHead.textContent = window.ArnonaI18n.t("results.savingsHeadline");
      saveRange.textContent = window.ArnonaI18n.t("results.savingsRange", { low: fmt(low), high: fmt(high) });
      saveNote.textContent = window.ArnonaI18n.t("results.savingsNote");
      saveBlock.classList.remove("hidden");
      if (maxPct * 100 >= 6) confettiIntensity = "high";
    } else if (saveBlock) {
      saveBlock.classList.add("hidden");
    }

    countUp(minEl, Number(c.estimate_min_pct), 900);
    window.setTimeout(() => countUp(maxEl, Number(c.estimate_max_pct), 1000), 120);

    window.setTimeout(() => playConfetti(confettiIntensity), 320);

    const ul = $("results-breakdown");
    if (ul) {
      ul.innerHTML = "";
      (c.breakdown || []).forEach((row, i) => {
        const li = document.createElement("li");
        li.className =
          "rounded-xl border border-slate-100/90 bg-slate-50/50 p-3 opacity-0-start animate-fade-up animate-fill-mode-forwards";
        li.style.animationDelay = `${0.12 + i * 0.06}s`;
        const key = `breakdown.${row.component}`;
        const title = window.ArnonaI18n.t(key);
        const label = title === key ? row.component : title;
        const maxBar = Math.max(Number(row.contribution_max_pct), Number(row.contribution_min_pct), 0.01);
        const wMax = (Number(row.contribution_max_pct) / maxBar) * 100;
        li.innerHTML = `
          <div class="flex justify-between gap-2 text-xs font-semibold text-slate-800">
            <span>${label}</span>
            <span class="tabular-nums text-brand-700">${Number(row.contribution_min_pct).toFixed(2)}–${Number(row.contribution_max_pct).toFixed(2)}%</span>
          </div>
          <div class="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div class="js-breakdown-bar h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-300 to-forest-400 transition-all duration-700 ease-out" style="width:0%"></div>
          </div>
        `;
        ul.appendChild(li);
        const inner = li.querySelector(".js-breakdown-bar");
        window.requestAnimationFrame(() => {
          if (inner) inner.style.width = `${Math.min(100, wMax)}%`;
        });
      });
    }
    renderResultsKitState();
    syncResultsHighSavingsUi();
  }

  function shareText() {
    const c = state.lastCalc;
    if (!c) return "";
    const main = window.ArnonaI18n.t("results.shareText", {
      min: String(c.estimate_min_pct),
      max: String(c.estimate_max_pct),
    });
    const wa = window.ArnonaI18n.t("results.shareWaFooter");
    return `${main}\n\n${wa}\n\n${window.location.href}`;
  }

  function buildLangBar() {
    const bar = $("lang-bar");
    if (!bar) return;
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
        applyStaticI18n();
        if (state.view === "quiz") renderQuiz();
        if (state.view === "results" && state.lastCalc) {
          renderResultsAnimated();
        } else if (state.view === "results") {
          renderResultsKitState();
        }
      });
      bar.appendChild(b);
    });
  }

  async function tryLoadPremiumChecklist(token) {
    const wrap = $("thankyou-checklist-wrap");
    const ul = $("thankyou-checklist");
    if (!wrap || !ul) return;
    wrap.classList.add("hidden");
    ul.innerHTML = "";
    const body = {
      city_id: state.form.city_id,
      household_size: state.form.household_size,
      gross_monthly_income_nis: Number(state.form.gross_monthly_income_nis),
      apartment_sqm: Number(state.form.apartment_sqm),
      special_statuses: state.form.special_statuses || [],
      rules_year: state.form.rules_year,
      locale: window.ArnonaI18n.getLocale(),
    };
    try {
      const res = await fetch(`${API_ROOT}/generate-checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Access-Token": token },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const data = await res.json();
      (data.items || []).slice(0, 12).forEach((it) => {
        const li = document.createElement("li");
        li.className = "rounded-lg bg-slate-50/80 px-3 py-2 ring-1 ring-slate-100";
        li.innerHTML = `<span class="font-medium text-slate-900">${escapeHtml(it.title)}</span><br/><span class="text-slate-600">${escapeHtml(it.detail)}</span>`;
        ul.appendChild(li);
      });
      if (ul.children.length) wrap.classList.remove("hidden");
    } catch {
      /* optional */
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function wire() {
    $("year").textContent = String(new Date().getFullYear());

    $("logo-home")?.addEventListener("click", (e) => {
      e.preventDefault();
      showView("landing");
      applyStaticI18n();
    });

    $("btn-start")?.addEventListener("click", () => {
      clearProgress();
      state.step = 0;
      state.citiesCatalog = null;
      state.catalog = null;
      showView("quiz");
      ensureCities()
        .then(() => renderQuiz())
        .catch(() => renderQuiz());
    });

    $("btn-resume")?.addEventListener("click", () => {
      $("flow-resume-banner")?.classList.add("hidden");
      if (state.kitUrls) {
        const origin = window.location.origin;
        $("link-pdf").href = `${origin}${state.kitUrls.checklist_pdf}`;
        $("link-zip").href = `${origin}${state.kitUrls.templates_zip}`;
      }
      showView(state.view);
      if (state.view === "quiz") {
        ensureCities()
          .then(() => ensureCatalog())
          .finally(() => renderQuiz());
      } else if (state.view === "results" && state.lastCalc) {
        void refreshPremiumFromServer().then(() => {
          renderResultsAnimated();
        });
      } else if (state.view === "results") {
        void refreshPremiumFromServer().then(() => {
          renderResultsKitState();
          syncResultsHighSavingsUi();
        });
      } else if (state.view === "success" && state.accessToken) {
        tryLoadPremiumChecklist(state.accessToken);
      }
    });

    $("btn-discard-saved")?.addEventListener("click", () => {
      clearProgress();
      $("flow-resume-banner")?.classList.add("hidden");
      applyStaticI18n();
    });

    $("btn-quiz-back")?.addEventListener("click", () => {
      if (state.step > 0) {
        state.step -= 1;
        renderQuiz();
      }
    });

    $("btn-quiz-next")?.addEventListener("click", async () => {
      const err = validateStep();
      if (err) {
        showToast(err);
        return;
      }
      if (state.step < STEPS - 1) {
        state.step += 1;
        renderQuiz();
        return;
      }
      const btn = $("btn-quiz-next");
      const old = btn.textContent;
      btn.disabled = true;
      btn.textContent = window.ArnonaI18n.t("wizard.submitting");
      try {
        await submitWizard();
      } catch (e) {
        showToast(
          e && e.message === "network"
            ? window.ArnonaI18n.t("errors.network")
            : window.ArnonaI18n.t("results.calculateError"),
        );
      } finally {
        btn.disabled = false;
        btn.textContent = old;
      }
    });

    const restart = () => {
      clearProgress();
      state.citiesCatalog = null;
      state.catalog = null;
      $("flow-resume-banner")?.classList.add("hidden");
      showView("landing");
      applyStaticI18n();
    };
    $("btn-restart-1")?.addEventListener("click", restart);
    $("btn-restart-2")?.addEventListener("click", restart);

    $("btn-share-wa")?.addEventListener("click", () => {
      const url = `https://wa.me/?text=${encodeURIComponent(shareText())}`;
      window.open(url, "_blank", "noopener,noreferrer");
    });
    $("btn-share-fb")?.addEventListener("click", () => {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    });

    window.addEventListener("arnonacut:locale", () => {
      buildLangBar();
      applyStaticI18n();
      if (state.view === "quiz") renderQuiz();
      if (state.view === "results") {
        if (state.lastCalc) renderResultsAnimated();
        else {
          renderResultsKitState();
          syncResultsHighSavingsUi();
        }
      }
    });
  }

  async function boot() {
    wire();
    let loc = localStorage.getItem("arnonacut_locale");
    if (!SUPPORTED.includes(loc)) {
      const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
      loc = SUPPORTED.includes(nav) ? nav : "en";
    }
    await window.ArnonaI18n.setLocale(loc);
    buildLangBar();
    applyStaticI18n();

    const saved = loadSaved();
    if (saved && saved.view && saved.view !== "landing") {
      applySaved(saved);
      $("flow-resume-banner")?.classList.remove("hidden");
    }
    mergePremiumFromDisk();
    await refreshPremiumFromServer();

    const params = new URLSearchParams(window.location.search);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    if (params.get("kit") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      if (state.kitUnlocked) {
        if (state.lastCalc) {
          showView("results");
          renderResultsAnimated();
        } else {
          showView("results");
          renderResultsKitState();
        }
        showToast(window.ArnonaI18n.t("checkout.successToast"));
      } else {
        showToast(window.ArnonaI18n.t("checkout.error"));
        showView("landing");
      }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
