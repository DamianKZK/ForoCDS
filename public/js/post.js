/* post.js — detalle de una publicación (post.html?id=...)
   Endpoints: GET /api/posts/:id, PUT /api/posts/:id/resolver,
              POST /api/comentarios, DELETE /api/comentarios/:id */
(function () {
  'use strict';
  if (!Foro.requireSession()) return;
  Foro.initTopbar();

  var el = Foro.el;
  var postId = new URLSearchParams(window.location.search).get('id');

  var $root = document.getElementById('post-root');
  var $answers = document.getElementById('answers');
  var $count = document.getElementById('answers-count');
  var $comments = document.getElementById('comments');
  var $form = document.getElementById('comment-form');
  var $body = document.getElementById('c-body');
  var $submit = document.getElementById('c-submit');
  var $error = document.getElementById('c-error');
  var $resolvedNote = document.getElementById('c-resolved');

  var current = null; // { post, comments }

  /* ---------- Carga ---------- */
  function showError(title, text, retry) {
    $answers.hidden = true;
    $root.setAttribute('aria-busy', 'false');
    $root.replaceChildren(el('div', { class: 'state-box state-box--solid', role: 'alert' },
      el('h3', { text: title }),
      el('p', { text: text }),
      retry ? el('button', { class: 'btn btn--primary', type: 'button', text: 'Reintentar', onclick: load }) : null
    ));
  }

  function load() {
    if (!postId) {
      showError('No encontramos esta publicación', 'El enlace no incluye un identificador válido.', false);
      return;
    }
    $root.setAttribute('aria-busy', 'true');
    $root.replaceChildren(el('div', { class: 'skeleton', style: 'height:360px' }));

    Promise.all([
      Foro.request('/api/posts/' + encodeURIComponent(postId)),
      Foro.request('/api/categorias').catch(function () { return []; })
    ]).then(function (res) {
      var data = res[0] || {};
      var cats = (Array.isArray(res[1]) ? res[1] : []).map(Foro.normalizeCategory);
      var rawPost = data.post || data;
      var rawComments = data.comentarios || rawPost.comentarios || [];
      current = {
        post: Foro.normalizePost(rawPost, cats),
        comments: (Array.isArray(rawComments) ? rawComments : []).map(Foro.normalizeComment)
      };
      document.title = current.post.titulo + ' · Foro CUCEI';
      render();
    }).catch(function (err) {
      if (err.status === 404) showError('No encontramos esta publicación', 'Puede que se haya eliminado.', false);
      else showError('No pudimos cargar la publicación', 'Revisa tu conexión e inténtalo de nuevo.', true);
    });
  }

  /* ---------- Render ---------- */
  function categoryPill(name) {
    var s = Foro.slug(name);
    return el('span', { class: 'pill' + (s === 'dudas' || s === 'tramites' ? ' pill--' + s : ''), text: name });
  }

  function renderArticle() {
    var p = current.post;
    var isAuthor = String(p.usuarioId) === String(Foro.session.id);

    var parts = [];
    if (p.resuelta) {
      parts.push(el('div', { class: 'article__banner', role: 'status' }, Foro.icon('checkLg'), 'Este post ya está resuelto'));
    }

    var body = [
      el('div', { class: 'article__top' },
        categoryPill(p.categoria),
        el('span', { class: 'pill ' + (p.resuelta ? 'pill--res' : 'pill--pend'), text: p.resuelta ? 'Resuelta' : 'Pendiente' })
      ),
      el('h1', { text: p.titulo }),
      el('div', { class: 'article__meta' },
        el('span', { class: 'avatar avatar--lg', text: Foro.initial(p.autor) }),
        el('span', { text: p.autor + ' · ' + Foro.timeAgo(p.fecha) + ' · ' + Foro.plural(p.vistas, 'vista', 'vistas') })
      ),
      el('p', { class: 'article__text', text: p.contenido })
    ];

    var img = Foro.imageUrl(p.imagen);
    if (img) body.push(el('img', { class: 'article__img', src: img, alt: 'Imagen de la publicación', loading: 'lazy' }));

    var hint = p.resuelta
      ? (isAuthor ? 'Marcaste este post como resuelto.' : 'El autor marcó este post como resuelto.')
      : (isAuthor ? 'Solo tú, como autor, decides si tu duda ya quedó resuelta.' : 'Solo quien publicó la duda decide si quedó resuelta.');
    var panel = [el('p', { text: hint })];
    if (isAuthor && !p.resuelta) {
      var btn = el('button', { class: 'btn btn--primary', type: 'button', text: 'Marcar como resuelto' });
      btn.addEventListener('click', function () {
        btn.disabled = true;
        btn.textContent = 'Guardando…';
        Foro.request('/api/posts/' + encodeURIComponent(p.id) + '/resolver',
          Foro.jsonOptions('PUT', { usuario_id: Foro.session.id }))
          .then(load)
          .catch(function (err) {
            btn.disabled = false;
            btn.textContent = 'Marcar como resuelto';
            window.alert(err.message || 'No pudimos marcar el post como resuelto.');
          });
      });
      panel.push(btn);
    }
    body.push(el('div', { class: 'resolve-panel' }, panel));

    parts.push(el('div', { class: 'article__body' }, body));
    $root.setAttribute('aria-busy', 'false');
    $root.replaceChildren(el('article', { class: 'article' + (p.resuelta ? ' is-resolved' : '') }, parts));
  }

  function commentTime(c) {
    var d = Foro.parseDate(c.fecha);
    return d ? d.getTime() : 0;
  }

  function commentCard(c) {
    var p = current.post;
    var mine = String(c.usuarioId) === String(Foro.session.id);
    var who = [el('b', { text: c.autor })];

    if (c.oficial) who.push(el('span', { class: 'pill pill--staff' }, Foro.icon('check'), c.rolLabel + ' · Respuesta oficial'));
    else who.push(el('span', { class: 'pill pill--outline', text: 'Estudiante' }));
    if (String(c.usuarioId) === String(p.usuarioId)) who.push(el('span', { class: 'pill pill--author', text: 'Autor' }));
    who.push(el('span', { text: '· ' + Foro.timeAgo(c.fecha) }));

    var actions = el('div');
    function showDelete() {
      var del = el('button', { class: 'link-danger', type: 'button', text: 'Eliminar' });
      del.addEventListener('click', showConfirm);
      actions.replaceChildren(del);
    }
    function showConfirm() {
      var no = el('button', { class: 'btn-no', type: 'button', text: 'Cancelar' });
      var yes = el('button', { class: 'btn-yes', type: 'button', text: 'Sí, eliminar' });
      no.addEventListener('click', showDelete);
      yes.addEventListener('click', function () {
        yes.disabled = true;
        Foro.request(Foro.CONFIG.deleteCommentUrl(c.id),
          Foro.jsonOptions('DELETE', { usuario_id: Foro.session.id }))
          .then(load)
          .catch(function (err) {
            yes.disabled = false;
            window.alert(err.message || 'No pudimos eliminar el comentario.');
          });
      });
      actions.replaceChildren(el('div', { class: 'confirm', role: 'alertdialog', 'aria-label': 'Confirmar eliminación' },
        el('span', { text: '¿Eliminar este comentario?' }), no, yes));
      no.focus();
    }
    if (mine) showDelete();

    return el('div', { class: 'comment' + (c.oficial ? ' comment--staff' : '') },
      el('span', { class: 'avatar', text: Foro.initial(c.autor) }),
      el('div', { class: 'comment__main' },
        el('div', { class: 'comment__head' }, el('div', { class: 'comment__who' }, who), actions),
        el('p', { class: 'comment__text', text: c.contenido })
      )
    );
  }

  function renderComments() {
    var list = current.comments.slice().sort(function (a, b) {
      if (a.oficial !== b.oficial) return a.oficial ? -1 : 1;
      return (commentTime(a) - commentTime(b)) || (Number(a.id) - Number(b.id));
    });
    $count.textContent = String(list.length);
    $answers.hidden = false;
    $resolvedNote.hidden = !current.post.resuelta;

    if (!list.length) {
      $comments.replaceChildren(el('div', { class: 'state-box' },
        el('h3', { text: 'Aún no hay respuestas' }),
        el('p', { text: 'Sé la primera persona en responder.' })
      ));
      return;
    }
    $comments.replaceChildren.apply($comments, list.map(commentCard));
  }

  function render() {
    renderArticle();
    renderComments();
  }

  /* ---------- Nueva respuesta ---------- */
  $body.addEventListener('input', function () {
    $error.textContent = '';
    $submit.disabled = $body.value.trim().length === 0;
  });

  $form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $body.value.trim();
    if (!text || !current) return;
    $submit.disabled = true;
    $submit.textContent = 'Enviando…';
    $error.textContent = '';

    Foro.request('/api/comentarios', Foro.jsonOptions('POST', {
      post_id: current.post.id,
      usuario_id: Foro.session.id,
      contenido: text
    }))
      .then(function () {
        $body.value = '';
        return load();
      })
      .catch(function (err) {
        $error.textContent = err.message || 'No pudimos enviar tu respuesta. Inténtalo de nuevo.';
      })
      .then(function () {
        $submit.textContent = 'Responder';
        $submit.disabled = $body.value.trim().length === 0;
      });
  });

  load();
})();
