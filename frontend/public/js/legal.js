/* global window, document */
(function (global) {
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Renders `legal.fullDisclaimerBody` from ArnonaI18n into a container.
   * Paragraphs are separated by one or more blank lines (\\n\\n) in the JSON string.
   */
  function renderInto(rootEl) {
    if (!rootEl || !global.ArnonaI18n) return;
    const body = global.ArnonaI18n.t("legal.fullDisclaimerBody");
    if (!body || body === "legal.fullDisclaimerBody") {
      rootEl.innerHTML = "";
      return;
    }
    const parts = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    rootEl.innerHTML = parts
      .map(
        (p) =>
          `<p class="mb-3 text-sm leading-relaxed text-slate-700 last:mb-0">${escapeHtml(p)}</p>`,
      )
      .join("");
  }

  global.ArnonaLegal = { renderInto };
})(window);
