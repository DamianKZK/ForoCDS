// public/post.js
// Página de detalle de un post: contenido completo, imagen, comentarios
// y botón para que el autor lo marque como resuelto.

const API = '/api';

const usuarioId = localStorage.getItem('usuarioId');
const usuarioNombre = localStorage.getItem('usuarioNombre');

if (!usuarioId) {
  window.location.href = 'index.html';
}

const postId = new URLSearchParams(window.location.search).get('id');
if (!postId) {
  window.location.href = 'foro.html';
}

const el = {
  saludo: document.getElementById('saludo-usuario'),
  btnLogout: document.getElementById('btn-logout'),
  detalle: document.getElementById('post-detalle'),
  resolverBox: document.getElementById('post-resolver-box'),
  btnResolver: document.getElementById('btn-resolver'),
  listaComentarios: document.getElementById('lista-comentarios'),
  formComentario: document.getElementById('form-comentario'),
  inputComentario: document.getElementById('input-comentario'),
  comentarioError: document.getElementById('comentario-error'),
};

init();

async function init() {
  el.saludo.textContent = `Hola, ${usuarioNombre || 'usuario'}`;
  el.btnLogout.addEventListener('click', cerrarSesion);
  el.formComentario.addEventListener('submit', onCrearComentario);
  el.btnResolver.addEventListener('click', onMarcarResuelto);

  await cargarPost();
}

function cerrarSesion() {
  localStorage.removeItem('usuarioId');
  localStorage.removeItem('usuarioNombre');
  localStorage.removeItem('usuarioEmail');
  window.location.href = 'index.html';
}

// ----------------------------------------------------------
// Cargar post + comentarios
// ----------------------------------------------------------
async function cargarPost() {
  try {
    const res = await fetch(`${API}/posts/${postId}`);
    if (!res.ok) throw new Error('No se encontró la publicación');
    const post = await res.json();

    renderPost(post);
    renderComentarios(post.comentarios);

    // Solo el autor ve el botón, y solo si sigue pendiente
    if (Number(post.usuario_id) === Number(usuarioId) && post.estado !== 'resuelta') {
      el.resolverBox.hidden = false;
    }
  } catch (error) {
    console.error(error);
    el.detalle.innerHTML = '<p class="feed-count">No se pudo cargar la publicación.</p>';
  }
}

function renderPost(post) {
  const fecha = new Date(post.fecha_creacion).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const badgeClase = post.estado === 'resuelta' ? 'badge-resuelta' : 'badge-pendiente';
  const badgeTexto = post.estado === 'resuelta' ? 'Resuelta' : 'Pendiente';

  el.detalle.innerHTML = `
    <div class="post-card-meta">
      <span class="post-card-categoria">${escapeHtml(post.categoria)}</span>
      <span>· ${escapeHtml(post.autor)}</span>
      <span>· ${fecha}</span>
      <span class="badge-estado ${badgeClase}" id="badge-estado">${badgeTexto}</span>
    </div>
    <h1>${escapeHtml(post.titulo)}</h1>
    <p class="post-contenido">${escapeHtml(post.contenido)}</p>
    ${post.imagen_url ? `<img src="${post.imagen_url}" alt="Imagen de la publicación">` : ''}
  `;
}

function renderComentarios(comentarios) {
  if (!comentarios || comentarios.length === 0) {
    el.listaComentarios.innerHTML = '<p class="comentarios-vacio">Todavía no hay respuestas. Sé el primero en ayudar.</p>';
    return;
  }

  el.listaComentarios.innerHTML = comentarios.map((c) => {
    const fecha = new Date(c.fecha_creacion).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    return `
      <div class="comentario">
        <div class="comentario-meta">${escapeHtml(c.autor)} · ${fecha}</div>
        <p>${escapeHtml(c.contenido)}</p>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------------
// Crear comentario
// ----------------------------------------------------------
async function onCrearComentario(event) {
  event.preventDefault();
  el.comentarioError.hidden = true;

  const contenido = el.inputComentario.value.trim();
  if (!contenido) return;

  try {
    const res = await fetch(`${API}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: Number(postId), usuario_id: Number(usuarioId), contenido }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo publicar el comentario');
    }

    el.inputComentario.value = '';
    await cargarPost();
  } catch (error) {
    el.comentarioError.textContent = error.message;
    el.comentarioError.hidden = false;
  }
}

// ----------------------------------------------------------
// Marcar como resuelto
// ----------------------------------------------------------
async function onMarcarResuelto() {
  el.btnResolver.disabled = true;
  el.btnResolver.textContent = 'Marcando...';

  try {
    const res = await fetch(`${API}/posts/${postId}/resolver`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: Number(usuarioId) }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo marcar como resuelto');
    }

    el.resolverBox.hidden = true;
    await cargarPost();
  } catch (error) {
    alert(error.message);
    el.btnResolver.disabled = false;
    el.btnResolver.textContent = 'Marcar como resuelta';
  }
}

// ----------------------------------------------------------
// Utilidades
// ----------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
