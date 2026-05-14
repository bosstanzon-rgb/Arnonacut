/* global window, document, fetch */
(function () {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderDoc(doc) {
    if (!doc) return "";
    const parts = [`<h1 class="text-2xl font-semibold tracking-tight text-slate-900">${escapeHtml(doc.title)}</h1>`];
    if (doc.updated) {
      parts.push(`<p class="mt-2 text-sm text-slate-500">${escapeHtml(doc.updated)}</p>`);
    }
    (doc.sections || []).forEach((sec) => {
      parts.push(
        `<h2 class="mt-8 text-lg font-semibold text-slate-900">${escapeHtml(sec.heading)}</h2>` +
          `<p class="mt-2 text-sm leading-relaxed text-slate-700">${escapeHtml(sec.body)}</p>`,
      );
    });
    return `<article class="space-y-1">${parts.join("")}</article>`;
  }

  function renderDisclaimerFromBundle(body) {
    if (!body) return "";
    const paras = String(body)
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    return paras
      .map(
        (p) =>
          `<p class="mb-4 text-sm leading-relaxed text-slate-700 last:mb-0">${escapeHtml(p)}</p>`,
      )
      .join("");
  }

  async function bootPolicyTerms() {
    const script = document.getElementById("legal-boot");
    const url = script && script.getAttribute("data-bundle");
    const enRoot = document.getElementById("legal-en-root");
    const heRoot = document.getElementById("legal-he-root");
    if (!url || !enRoot || !heRoot) return;
    try {
      const data = await fetch(url, { cache: "no-store" }).then((r) => r.json());
      enRoot.innerHTML = renderDoc(data.en);
      heRoot.innerHTML = renderDoc(data.he);
    } catch {
      enRoot.innerHTML = "<p class=\"text-sm text-red-600\">Could not load legal document.</p>";
    }
  }

  async function bootDisclaimers() {
    const enRoot = document.getElementById("disc-en-root");
    const heRoot = document.getElementById("disc-he-root");
    if (!enRoot || !heRoot) return;
    try {
      const [en, he] = await Promise.all([
        fetch("/assets/lang/en.json", { cache: "no-store" }).then((r) => r.json()),
        fetch("/assets/lang/he.json", { cache: "no-store" }).then((r) => r.json()),
      ]);
      const enBody = en && en.legal && en.legal.fullDisclaimerBody;
      const heBody = he && he.legal && he.legal.fullDisclaimerBody;
      enRoot.innerHTML = renderDisclaimerFromBundle(enBody);
      heRoot.innerHTML = renderDisclaimerFromBundle(heBody);
    } catch {
      enRoot.textContent = "Unable to load disclaimers.";
    }
  }

  const mode = document.documentElement.getAttribute("data-legal-boot");
  if (mode === "policy-terms") bootPolicyTerms();
  else if (mode === "disclaimers") bootDisclaimers();
})();
