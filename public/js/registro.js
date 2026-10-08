/* registro.js — formulario "Crear cuenta": validación en vivo y POST /api/usuarios */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('panel-registro');
    if (!form) return;

    var nombre = document.getElementById('reg-nombre');
    var email = document.getElementById('reg-email');
    var pass = document.getElementById('reg-password');
    var submit = document.getElementById('reg-submit');
    var errorBox = document.getElementById('reg-error');
    var strength = document.getElementById('reg-strength');
    var strengthLabel = document.getElementById('reg-strength-label');

    function validate(showErrors) {
      var okName = nombre.value.trim().length >= 2;
      var okEmail = UI.isEmail(email.value.trim());
      var okPass = pass.value.length >= 8;

      if (showErrors || nombre.value) UI.setFieldError(nombre, nombre.value && !okName ? 'Escribe al menos 2 letras.' : '');
      if (showErrors || email.value) UI.setFieldError(email, email.value && !okEmail ? 'Escribe un correo válido, por ejemplo nombre@alumnos.udg.mx.' : '');
      if (showErrors || pass.value) UI.setFieldError(pass, pass.value && !okPass ? 'Usa al menos 8 caracteres.' : '');

      var level = UI.passwordStrength(pass.value);
      strength.hidden = level === 0;
      strength.setAttribute('data-level', String(level));
      strengthLabel.textContent = UI.strengthLabel(level);

      var valid = okName && okEmail && okPass;
      submit.disabled = !valid;
      return valid;
    }

    [nombre, email, pass].forEach(function (input) {
      input.addEventListener('input', function () { errorBox.textContent = ''; validate(false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(true)) return;
      submit.disabled = true;
      submit.textContent = 'Creando cuenta…';
      errorBox.textContent = '';

      // El backend espera la contraseña en texto plano (la hashea con bcrypt),
      // aunque el campo se llame password_hash.
      var body = {
        nombre: nombre.value.trim(),
        email: email.value.trim(),
        password_hash: pass.value
      };

      Foro.request('/api/usuarios', Foro.jsonOptions('POST', body))
        .then(function () {
          var loginEmail = document.getElementById('login-email');
          var ok = document.getElementById('login-ok');
          loginEmail.value = body.email;
          ok.textContent = 'Cuenta creada. Inicia sesión para entrar al foro.';
          form.reset();
          validate(false);
          window.AuthTabs.select('login');
          document.getElementById('login-password').focus();
        })
        .catch(function (err) {
          errorBox.textContent = err.message || 'No pudimos crear tu cuenta. Inténtalo de nuevo.';
        })
        .then(function () {
          submit.textContent = 'Crear cuenta';
          validate(false);
        });
    });
  });
})();
