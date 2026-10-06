/* ui.js — pequeños controles de interfaz: mostrar/ocultar contraseña,
   medidor de fortaleza y mensajes de error de campo. */
(function () {
  'use strict';

  /* Ojo abierto/cerrado: cualquier botón con data-toggle-pass="<id del input>" */
  function initPasswordToggles() {
    document.querySelectorAll('[data-toggle-pass]').forEach(function (btn) {
      var input = document.getElementById(btn.getAttribute('data-toggle-pass'));
      if (!input) return;
      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.classList.toggle('is-visible', show);
        input.focus();
      });
    });
  }

  /* 0 = vacía, 1 = débil, 2 = media, 3 = buena, 4 = fuerte */
  function passwordStrength(pw) {
    if (!pw) return 0;
    if (pw.length < 8) return 1;
    var score = 2;
    var mixed = /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]|[^A-Za-z0-9]/.test(pw);
    if (mixed) score = 3;
    if (mixed && pw.length >= 12) score = 4;
    return score;
  }
  var STRENGTH_LABELS = ['', 'Débil', 'Media', 'Buena', 'Fuerte'];

  /* Muestra u oculta el texto de error asociado a un input (id "<input.id>-error"). */
  function setFieldError(input, message) {
    var box = document.getElementById(input.id + '-error');
    if (box) box.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  document.addEventListener('DOMContentLoaded', initPasswordToggles);

  window.UI = {
    passwordStrength: passwordStrength,
    strengthLabel: function (level) { return STRENGTH_LABELS[level] || ''; },
    setFieldError: setFieldError,
    isEmail: function (v) { return EMAIL_RE.test(v); }
  };
})();
