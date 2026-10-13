/* admin.js — panel de administración: asignar y quitar el rol de admin.
   Endpoints: GET /api/usuarios, PUT /api/usuarios/:id/rol (solo admin). */
(function () {
  'use strict';
  if (!Foro.requireSession()) return;
  // Esto solo evita mostrar una pantalla vacía; la seguridad real la valida el servidor.
  if (!Foro.session.isAdmin) { window.location.replace('foro.html'); return; }
  Foro.initTopbar();

  var el = Foro.el;
  var $list = document.getElementById('users');
  var $search = document.getElementById('user-search');
  var $msg = document.getElementById('admin-msg');
  var users = [];
  var q = '';

  function showMsg(text, ok) {
    $msg.textContent = text || '';
    $msg.className = 'form-msg ' + (ok ? 'form-msg--ok' : 'form-msg--error');
  }

  function load() {
    Foro.request('/api/usuarios')
      .then(function (data) {
        users = Array.isArray(data) ? data : [];
        render();
      })
      .catch(function (err) {
        if (err.status === 401) { Foro.session.clear(); window.location.replace('index.html'); return; }
        if (err.status === 403) { window.location.replace('foro.html'); return; }
        showMsg(err.message || 'No pudimos cargar los usuarios.', false);
      });
  }

  function visibleUsers() {
    var term = q.trim().toLowerCase();
    return users.filter(function (u) {
      return !term || (u.nombre + ' ' + u.email).toLowerCase().indexOf(term) !== -1;
    }).sort(function (a, b) {
      if ((a.rol === 'admin') !== (b.rol === 'admin')) return a.rol === 'admin' ? -1 : 1;
      return String(a.nombre).localeCompare(String(b.nombre), 'es');
    });
  }

  function setRole(u, body, btn, okText) {
    btn.disabled = true;
    showMsg('');
    Foro.request('/api/usuarios/' + encodeURIComponent(u.id) + '/rol', Foro.jsonOptions('PUT', body))
      .then(function () {
        u.rol = body.rol;
        u.cargo = body.rol === 'admin' ? body.cargo : null;
        showMsg(okText, true);
        render();
      })
      .catch(function (err) {
        btn.disabled = false;
        showMsg(err.message || 'No pudimos cambiar el rol.', false);
      });
  }

  function userRow(u) {
    var isMe = String(u.id) === String(Foro.session.id);
    var isAdmin = u.rol === 'admin';

    var badge;
    if (isAdmin) badge = el('span', { class: 'pill pill--staff', text: Foro.CONFIG.CARGO_LABEL[u.cargo] || 'Admin' });
    else badge = el('span', { class: 'pill pill--outline', text: u.rol === 'moderador' ? 'Moderador' : 'Usuario' });

    var actions = el('div', { class: 'user-row__actions' });
    if (isMe) {
      actions.append(el('span', { class: 'pill pill--author', text: 'Tu cuenta' }));
    } else if (isAdmin) {
      var quitar = el('button', { class: 'btn btn--ghost btn--sm', type: 'button', text: 'Quitar admin' });
      quitar.addEventListener('click', function () {
        if (!window.confirm('¿Quitar el rol de administrador a ' + u.nombre + '?')) return;
        setRole(u, { rol: 'usuario' }, quitar, u.nombre + ' ya no es administrador.');
      });
      actions.append(quitar);
    } else {
      var cargo = el('select', { class: 'input', 'aria-label': 'Cargo de ' + u.nombre },
        el('option', { value: 'comite', text: 'Comité' }),
        el('option', { value: 'coordinador', text: 'Coordinador' })
      );
      var hacer = el('button', { class: 'btn btn--primary btn--sm', type: 'button', text: 'Hacer admin' });
      hacer.addEventListener('click', function () {
        setRole(u, { rol: 'admin', cargo: cargo.value }, hacer, u.nombre + ' ahora es administrador.');
      });
      actions.append(cargo, hacer);
    }

    return el('div', { class: 'user-row' },
      el('span', { class: 'avatar avatar--md', text: Foro.initial(u.nombre) }),
      el('div', { class: 'user-row__info' }, el('b', { text: u.nombre }), el('span', { text: u.email })),
      badge,
      actions
    );
  }

  function render() {
    var items = visibleUsers();
    if (!items.length) {
      $list.replaceChildren(el('div', { class: 'state-box' },
        el('h3', { text: 'Sin resultados' }),
        el('p', { text: 'Ningún usuario coincide con tu búsqueda.' })
      ));
      return;
    }
    $list.replaceChildren.apply($list, items.map(userRow));
  }

  $search.addEventListener('input', function () { q = $search.value; render(); });
  load();
})();