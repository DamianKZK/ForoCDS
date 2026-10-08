/* Tema claro/oscuro. Se carga en el <head> para evitar el parpadeo al abrir la página. */
(function () {
  'use strict';
  var KEY = 'foro-tema';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* sin almacenamiento: se ignora */ }
  }
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  apply(read() === 'dark' ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', function () {
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        apply(next);
        save(next);
      });
    });
  });
})();
