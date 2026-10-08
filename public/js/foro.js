/* foro.js — pantalla principal: feed, categorías, búsqueda, pestañas y nueva publicación.
   Endpoints: GET /api/categorias, GET /api/posts, POST /api/posts (multipart). */
(function () {
  'use strict';
  if (!Foro.requireSession()) return;
  Foro.initTopbar();

  var el = Foro.el;

  var state = {
    status: 'loading', // loading | ok | error
    error: '',
    posts: [],
    cats: [],
    scope: 'todos', // todos | mios
    cat: 'Todas',
    tab: 'recientes', // recientes | populares | sin_resolver | resueltos
    q: ''
  };

  var $feed = document.getElementById('feed');
  var $cats = document.getElementById('cats');
  var $help = document.getElementById('help');
  var $title = document.getElementById('feed-title');
  var $count = document.getElementById('feed-count');
  var $search = document.getElementById('search');

  /* ---------- Carga de datos ---------- */
  function asList(data, key) {
    if (Array.isArray(data)) return data;
    return (data && Array.isArray(data[key]) && data[key]) || [];
  }

  function load() {
    state.status = 'loading';
    render();
    Promise.all([Foro.request('/api/categorias'), Foro.request('/api/posts')])
      .then(function (res) {
        state.cats = asList(res[0], 'categorias').map(Foro.normalizeCategory);
        state.posts = asList(res[1], 'posts').map(function (p) { return Foro.normalizePost(p, state.cats); });
        state.status = 'ok';
        fillCategorySelect();
        render();
      })
      .catch(function (err) {
        state.status = 'error';
        state.error = err.message;
        render();
      });
  }

  /* ---------- Filtros ---------- */
  function time(p) {
    var d = Foro.parseDate(p.fecha);
    return d ? d.getTime() : 0;
  }

  function visiblePosts() {
    var q = state.q.trim().toLowerCase();
    var me = String(Foro.session.id);
    var list = state.posts.filter(function (p) {
      if (state.scope === 'mios' && String(p.usuarioId) !== me) return false;
      if (state.cat !== 'Todas' && p.categoria !== state.cat) return false;
      if (state.tab === 'sin_resolver' && p.resuelta) return false;
      if (state.tab === 'resueltos' && !p.resuelta) return false;
      if (q && (p.titulo + ' ' + p.contenido).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (state.tab === 'populares') return (b.vistas - a.vistas) || (time(b) - time(a));
      return (time(b) - time(a)) || (Number(b.id) - Number(a.id));
    });
    return list;
  }

  /* ---------- Render ---------- */
  function render() {
    renderScope();
    renderCats();
    renderTabs();
    renderFeed();
    renderHelp();
  }

  function renderScope() {
    document.querySelectorAll('[data-scope]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-scope') === state.scope));
    });
  }

  function renderTabs() {
    document.querySelectorAll('.tabs-bar [role="tab"]').forEach(function (tab) {
      tab.setAttribute('aria-selected', String(tab.getAttribute('data-tab') === state.tab));
    });
  }

  function renderCats() {
    var counts = { Todas: state.posts.length };
    state.posts.forEach(function (p) { counts[p.categoria] = (counts[p.categoria] || 0) + 1; });

    var names = ['Todas'].concat(state.cats.map(function (c) { return c.nombre; }));
    $cats.replaceChildren.apply($cats, names.map(function (name) {
      var active = state.cat === name;
      return el('button', {
        class: 'side-btn side-btn--cat',
        type: 'button',
        'aria-pressed': String(active),
        onclick: function () { state.cat = name; render(); }
      },
        el('span', { class: 'side-btn__dot side-btn__dot--' + (name === 'Todas' ? 'todas' : Foro.slug(name)) }),
        el('span', { class: 'side-btn__label', text: name }),
        el('span', { class: 'side-btn__count', text: String(counts[name] || 0) })
      );
    }));
  }

  function categoryPill(name) {
    var s = Foro.slug(name);
    var cls = 'pill' + (s === 'dudas' || s === 'tramites' ? ' pill--' + s : '');
    return el('span', { class: cls, text: name });
  }

  function postCard(p) {
    var foot = [categoryPill(p.categoria), el('span', { class: 'post-card__spacer' })];
    if (p.comentarios !== null) {
      foot.push(el('span', { class: 'stat', title: 'Respuestas' }, Foro.icon('chat'), String(p.comentarios)));
    }
    foot.push(el('span', { class: 'stat', title: 'Vistas' }, Foro.icon('eye'), String(p.vistas)));

    return el('a', { class: 'post-card', href: 'post.html?id=' + encodeURIComponent(p.id) },
      el('span', { class: 'avatar avatar--md', text: Foro.initial(p.autor) }),
      el('div', { class: 'post-card__body' },
        el('div', { class: 'post-card__top' },
          el('span', { class: 'post-card__who' }, el('b', { text: p.autor }), ' · ' + Foro.timeAgo(p.fecha)),
          el('span', { class: 'pill ' + (p.resuelta ? 'pill--res' : 'pill--pend'), text: p.resuelta ? 'Resuelta' : 'Pendiente' })
        ),
        el('h3', { text: p.titulo }),
        el('p', { text: p.contenido }),
        el('div', { class: 'post-card__foot' }, foot)
      )
    );
  }

  function stateBox(title, text, solid, action) {
    return el('div', { class: 'state-box' + (solid ? ' state-box--solid' : ''), role: solid ? 'alert' : null },
      el('h3', { text: title }),
      el('p', { text: text }),
      action
    );
  }

  function emptyMessage() {
    if (state.q.trim()) return 'Ningún post coincide con tu búsqueda. Prueba con otras palabras.';
    if (state.scope === 'mios') return 'Todavía no has publicado nada. Usa “Crear publicación” para empezar.';
    return 'Todavía no hay posts con estos filtros.';
  }

  function renderFeed() {
    var items = state.status === 'ok' ? visiblePosts() : [];
    $title.textContent = state.cat === 'Todas' ? (state.scope === 'mios' ? 'Mis posts' : 'Todas las publicaciones') : state.cat;
    $count.textContent = state.status === 'ok' ? Foro.plural(items.length, 'publicación', 'publicaciones').replace('publicaciónes', 'publicaciones') : '';
    $feed.setAttribute('aria-busy', String(state.status === 'loading'));

    if (state.status === 'loading') {
      $feed.replaceChildren(el('div', { class: 'skeleton' }), el('div', { class: 'skeleton' }), el('div', { class: 'skeleton' }));
      return;
    }
    if (state.status === 'error') {
      $feed.replaceChildren(stateBox(
        'No pudimos cargar los posts',
        'Revisa tu conexión e inténtalo de nuevo. Si el problema sigue, avisa al equipo del foro.',
        true,
        el('button', { class: 'btn btn--primary', type: 'button', text: 'Reintentar', onclick: load })
      ));
      return;
    }
    if (!items.length) {
      $feed.replaceChildren(stateBox('Nada por aquí', emptyMessage(), false));
      return;
    }
    $feed.replaceChildren.apply($feed, items.map(postCard));
  }

  function renderHelp() {
    var pending = state.posts.filter(function (p) { return !p.resuelta; });
    pending.sort(function (a, b) {
      var ca = a.comentarios === null ? Infinity : a.comentarios;
      var cb = b.comentarios === null ? Infinity : b.comentarios;
      if (ca !== cb) return ca < cb ? -1 : 1;
      return time(b) - time(a);
    });
    var top = pending.slice(0, 3);
    if (!top.length) {
      $help.replaceChildren(el('div', { class: 'help-empty', text: state.status === 'ok' ? 'No hay dudas pendientes por ahora.' : '' }));
      return;
    }
    $help.replaceChildren.apply($help, top.map(function (p) {
      var meta = (p.comentarios !== null ? Foro.plural(p.comentarios, 'respuesta', 'respuestas') + ' · ' : '') + p.categoria;
      return el('a', { class: 'help-item', href: 'post.html?id=' + encodeURIComponent(p.id) },
        el('b', { text: p.titulo }),
        el('span', { text: meta })
      );
    }));
  }

  /* ---------- Eventos de filtros ---------- */
  document.querySelectorAll('[data-scope]').forEach(function (btn) {
    btn.addEventListener('click', function () { state.scope = btn.getAttribute('data-scope'); render(); });
  });
  document.querySelectorAll('.tabs-bar [role="tab"]').forEach(function (tab) {
    tab.addEventListener('click', function () { state.tab = tab.getAttribute('data-tab'); render(); });
  });
  $search.addEventListener('input', function () { state.q = $search.value; renderFeed(); });

  /* ---------- Modal: nueva publicación ---------- */
  var $modal = document.getElementById('modal');
  var $form = document.getElementById('post-form');
  var $fCat = document.getElementById('f-cat');
  var $fTitle = document.getElementById('f-title');
  var $fBody = document.getElementById('f-body');
  var $fImg = document.getElementById('f-img');
  var $fCounter = document.getElementById('f-counter');
  var $fCount = document.getElementById('f-count');
  var $fImgErr = document.getElementById('f-img-error');
  var $fError = document.getElementById('f-error');
  var $fSubmit = document.getElementById('f-submit');
  var lastFocus = null;

  function fillCategorySelect() {
    $fCat.replaceChildren.apply($fCat, state.cats.map(function (c) {
      return el('option', { value: String(c.id), text: c.nombre });
    }));
  }

  function imageOk() {
    var file = $fImg.files && $fImg.files[0];
    if (!file) return true;
    return /\.png$/i.test(file.name);
  }

  function validateForm() {
    var len = $fBody.value.length;
    var bad = len > 0 && (len < 20 || len > 150);
    $fCount.textContent = len + '/150';
    $fCounter.classList.toggle('is-bad', bad);

    var okImg = imageOk();
    $fImgErr.textContent = okImg ? '' : 'Solo se permiten imágenes .png.';

    var valid = !!$fCat.value && $fTitle.value.trim().length > 0 && len >= 20 && len <= 150 && okImg;
    $fSubmit.disabled = !valid;
    return valid;
  }

  function openModal() {
    lastFocus = document.activeElement;
    $fError.textContent = '';
    $modal.hidden = false;
    document.body.style.overflow = 'hidden';
    validateForm();
    $fTitle.focus();
  }
  function closeModal() {
    $modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (b) { b.addEventListener('click', openModal); });
  document.querySelectorAll('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
  $modal.addEventListener('mousedown', function (e) { if (e.target === $modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$modal.hidden) closeModal(); });
  [$fCat, $fTitle, $fBody, $fImg].forEach(function (f) {
    f.addEventListener('input', function () { $fError.textContent = ''; validateForm(); });
    f.addEventListener('change', validateForm);
  });

  $form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validateForm()) return;
    $fSubmit.disabled = true;
    $fSubmit.textContent = 'Publicando…';
    $fError.textContent = '';

    var fd = new FormData();
    fd.append('usuario_id', Foro.session.id);
    fd.append('categoria_id', $fCat.value);
    fd.append('titulo', $fTitle.value.trim());
    fd.append('contenido', $fBody.value);
    if ($fImg.files && $fImg.files[0]) fd.append('imagen', $fImg.files[0]);

    // Sin Content-Type: el navegador lo arma con el boundary del multipart.
    Foro.request('/api/posts', { method: 'POST', body: fd })
      .then(function () {
        $form.reset();
        closeModal();
        state.scope = 'todos';
        state.cat = 'Todas';
        state.tab = 'recientes';
        load();
      })
      .catch(function (err) {
        $fError.textContent = err.message || 'No pudimos publicar. Inténtalo de nuevo.';
      })
      .then(function () {
        $fSubmit.textContent = 'Publicar';
        validateForm();
      });
  });

  load();
})();
