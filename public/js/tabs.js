/* tabs.js — cambia entre "Iniciar sesión" y "Crear cuenta" con animación de deslizamiento. */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var track = document.getElementById('auth-track');
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs-pill [role="tab"]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('.auth-panel'));
    if (!track || !tabs.length) return;

    function select(name, focus) {
      track.setAttribute('data-active', name);
      tabs.forEach(function (tab) {
        var on = tab.getAttribute('data-tab') === name;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      });
      panels.forEach(function (panel) {
        var on = panel.getAttribute('data-panel') === name;
        if (on) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab.getAttribute('data-tab')); });
      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        select(next.getAttribute('data-tab'), true);
      });
    });

    window.AuthTabs = { select: select };
  });
})();
