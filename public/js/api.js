/* ==========================================================================
   api.js — utilidades compartidas por todas las pantallas.
   Expone window.Foro con: CONFIG, sesión, llamadas a la API, normalizadores,
   y helpers de DOM. Si tu backend usa otros nombres de campo o rutas, el único
   archivo que hay que tocar es este (CONFIG y las funciones normalize*).
   ========================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    // Mismo origen que el que sirve public/. Cambia solo si la API vive en otro host.
    API_BASE: '',
    // Claves de localStorage donde se guarda la "sesión" actual.
    STORAGE_ID: 'usuarioId',
    STORAGE_NAME: 'nombre',
    // Etiqueta que se muestra para cada rol de la tabla usuarios (los 'usuario' no llevan etiqueta).
    ROL_LABEL: { moderador: 'Comité', admin: 'Administración' },
    // Ruta para borrar un comentario.
    deleteCommentUrl: function (id) { return '/api/comentarios/' + encodeURIComponent(id); }
  };

  /* ---------- Sesión ---------- */
  function store(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  var session = {
    get id() { return store(CONFIG.STORAGE_ID); },
    get nombre() { return store(CONFIG.STORAGE_NAME) || 'Usuario'; },
    save: function (id, nombre) {
      try {
        localStorage.setItem(CONFIG.STORAGE_ID, String(id));
        localStorage.setItem(CONFIG.STORAGE_NAME, nombre || '');
      } catch (e) { /* ignorar */ }
    },
    clear: function () {
      try {
        localStorage.removeItem(CONFIG.STORAGE_ID);
        localStorage.removeItem(CONFIG.STORAGE_NAME);
      } catch (e) { /* ignorar */ }
    }
  };

  function requireSession() {
    if (!session.id) {
      window.location.replace('index.html');
      return false;
    }
    return true;
  }

  /* ---------- Llamadas HTTP ---------- */
  function request(path, options) {
    return fetch(CONFIG.API_BASE + path, options || {}).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        if (text) {
          try { data = JSON.parse(text); } catch (e) { data = text; }
        }
        if (!res.ok) {
          var msg = (data && typeof data === 'object' && (data.mensaje || data.error || data.message)) ||
            'Error ' + res.status;
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }
  function jsonOptions(method, body) {
    return {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    };
  }

  /* ---------- Normalizadores (aceptan varios nombres de campo comunes) ---------- */
  function pick() {
    for (var i = 0; i < arguments.length; i++) {
      var v = arguments[i];
      if (v !== undefined && v !== null && v !== '' && typeof v !== 'object') return v;
    }
    return null;
  }
  function toNumber(v) {
    var n = Number(v);
    return v === null || v === undefined || isNaN(n) ? null : n;
  }

  function normalizeCategory(r) {
    return { id: r.id, nombre: String(pick(r.nombre, r.name) || 'General') };
  }

  function normalizePost(r, cats) {
    var catId = pick(r.categoria_id, r.categoriaId);
    var cat = (cats || []).filter(function (c) { return String(c.id) === String(catId); })[0];
    var comentarios = pick(r.total_comentarios, r.comentarios_count, r.num_comentarios, r.comentarios_total);
    if (comentarios === null && Array.isArray(r.comentarios)) comentarios = r.comentarios.length;
    return {
      id: r.id,
      usuarioId: pick(r.usuario_id, r.usuarioId),
      categoriaId: catId,
      categoria: String(pick(r.categoria_nombre, r.categoria) || (cat && cat.nombre) || 'General'),
      titulo: String(r.titulo || ''),
      contenido: String(r.contenido || ''),
      imagen: pick(r.imagen_url, r.imagen),
      resuelta: String(r.estado || '').toLowerCase() === 'resuelta',
      fecha: pick(r.fecha_creacion, r.fecha),
      vistas: toNumber(r.vistas) || 0,
      comentarios: toNumber(comentarios),
      autor: String(pick(r.autor_nombre, r.usuario_nombre, r.nombre_usuario, r.autor, r.nombre) || 'Usuario')
    };
  }

  function normalizeComment(r) {
    var rol = String(pick(r.rol, r.usuario_rol, r.rol_usuario) || 'usuario').toLowerCase();
    return {
      id: r.id,
      usuarioId: pick(r.usuario_id, r.usuarioId),
      contenido: String(r.contenido || ''),
      fecha: pick(r.fecha_creacion, r.fecha),
      autor: String(pick(r.autor_nombre, r.usuario_nombre, r.nombre_usuario, r.autor, r.nombre) || 'Usuario'),
      rol: rol,
      oficial: rol !== 'usuario' && !!CONFIG.ROL_LABEL[rol],
      rolLabel: CONFIG.ROL_LABEL[rol] || null
    };
  }

  /* ---------- Fechas ---------- */
  function parseDate(value) {
    if (!value) return null;
    var d = new Date(String(value).replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }
  function timeAgo(value) {
    var d = parseDate(value);
    if (!d) return '';
    var s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (s < 60) return 'ahora';
    var m = Math.floor(s / 60);
    if (m < 60) return 'hace ' + m + ' min';
    var h = Math.floor(m / 60);
    if (h < 24) return 'hace ' + h + ' h';
    var days = Math.floor(h / 24);
    if (days < 7) return 'hace ' + days + (days === 1 ? ' día' : ' días');
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ---------- Texto ---------- */
  function slug(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function initial(name) {
    return (String(name || '?').trim().charAt(0) || '?').toUpperCase();
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function imageUrl(path) {
    if (!path) return null;
    return /^(https?:)?\/\//.test(path) || path.charAt(0) === '/' ? path : '/' + path;
  }

  /* ---------- DOM (siempre textContent: el contenido de usuarios nunca se interpreta como HTML) ---------- */
  var ICONS = {
    chat: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    eye: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    checkLg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  function icon(name) {
    var span = document.createElement('span');
    span.style.display = 'inline-flex';
    span.innerHTML = ICONS[name] || '';
    return span;
  }
  function el(tag, attrs) {
    var node = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var kids = [].concat(arguments[i]);
      for (var j = 0; j < kids.length; j++) {
        var c = kids[j];
        if (c === null || c === undefined || c === false) continue;
        node.append(c.nodeType ? c : document.createTextNode(String(c)));
      }
    }
    return node;
  }

  /* ---------- Barra superior (menú de usuario) ---------- */
  function initTopbar() {
    var nameEl = document.getElementById('user-name');
    var initEl = document.getElementById('user-initial');
    var btn = document.getElementById('user-btn');
    var panel = document.getElementById('user-panel');
    var logout = document.getElementById('logout');
    if (nameEl) nameEl.textContent = session.nombre;
    if (initEl) initEl.textContent = initial(session.nombre);
    if (!btn || !panel) return;

    function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) { if (!panel.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    if (logout) {
      logout.addEventListener('click', function () {
        session.clear();
        window.location.href = 'index.html';
      });
    }
  }

  window.Foro = {
    CONFIG: CONFIG,
    session: session,
    requireSession: requireSession,
    request: request,
    jsonOptions: jsonOptions,
    normalizeCategory: normalizeCategory,
    normalizePost: normalizePost,
    normalizeComment: normalizeComment,
    timeAgo: timeAgo,
    parseDate: parseDate,
    slug: slug,
    initial: initial,
    plural: plural,
    imageUrl: imageUrl,
    icon: icon,
    el: el,
    initTopbar: initTopbar
  };
})();
