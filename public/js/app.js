/* app.js — formulario "Iniciar sesión": POST /api/login y redirección al foro */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // Si ya hay una sesión guardada, entra directo al foro.
    if (Foro.session.id) {
      window.location.replace('foro.html');
      return;
    }

    var form = document.getElementById('panel-login');
    var email = document.getElementById('login-email');
    var pass = document.getElementById('login-password');
    var submit = document.getElementById('login-submit');
    var errorBox = document.getElementById('login-error');
    var okBox = document.getElementById('login-ok');

    email.addEventListener('input', function () {
      var v = email.value.trim();
      UI.setFieldError(email, v && !UI.isEmail(v) ? 'Escribe un correo válido, por ejemplo nombre@alumnos.udg.mx.' : '');
      errorBox.textContent = '';
      okBox.textContent = '';
    });
    pass.addEventListener('input', function () { errorBox.textContent = ''; okBox.textContent = ''; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailValue = email.value.trim();
      if (!UI.isEmail(emailValue)) {
        UI.setFieldError(email, 'Escribe un correo válido, por ejemplo nombre@alumnos.udg.mx.');
        email.focus();
        return;
      }
      if (!pass.value) {
        errorBox.textContent = 'Escribe tu contraseña.';
        pass.focus();
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Entrando…';
      errorBox.textContent = '';
      okBox.textContent = '';

      Foro.request('/api/login', Foro.jsonOptions('POST', { email: emailValue, password: pass.value }))
        .then(function (data) {
          if (!data || data.usuarioId === undefined) throw new Error('Respuesta inesperada del servidor.');
          Foro.session.save(data.usuarioId, data.nombre);
          window.location.href = 'foro.html';
        })
        .catch(function (err) {
          errorBox.textContent = err.status === 401 || err.status === 400 || err.status === 404
            ? 'Correo o contraseña incorrectos.'
            : (err.message || 'No pudimos iniciar sesión. Inténtalo de nuevo.');
          submit.disabled = false;
          submit.textContent = 'Entrar al foro';
        });
    });
  });
})();
