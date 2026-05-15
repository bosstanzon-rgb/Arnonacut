/* global window, document */
(function () {
  function renderInto(el) {
    if (!el || !window.ArnonaI18n) return;
    const body = window.ArnonaI18n.t("legal.fullDisclaimerBody");
    el.textContent = body;
  }

  window.ArnonaLegal = { renderInto };
})();
