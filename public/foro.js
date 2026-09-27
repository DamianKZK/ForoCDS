// public/foro.js
// Pantalla de inicio del foro. Requiere que el usuario haya iniciado sesión
// (revisa localStorage, guardado por app.js al hacer login).

const API = '/api';
const MIN_CONTENIDO = 20;
const MAX_CONTENIDO = 150;

const usuarioId = localStorage.getItem('usuarioId');
const usuarioNombre = localStorage.getItem('usuarioNombre');

// Si no hay sesión iniciada, regresa al login.
if (!usuarioId) {
  window.location.href = 'index.html';
}

const el = {
  saludo: document.getElementById('saludo-usuario'),
  btnLogout: document.getElementById('btn-logout'),
  categoriaChips: document.getElementById('categoria-chips'),
  feed: document.getElementById('feed'),
  feedCount: document.getElementById('feed-count'),
  feedEmpty: document.getElementById('feed-empty'),
  btnNuevoPost: document.getElementById('btn-nuevo-post'),
  btnCancelarPost: document.getElementById('btn-cancelar-post'),
  postForm: document.getElementById('post-form'),
  form: document.getElementById('form-crear-post'),
  inputCategoria: document.getElementById('input-categoria'),
  inputTitulo: document.getElementById('input-titulo'),
  inputContenido: document.getElementById('input-contenido'),
  contador: document.getElementById('contador-caracteres'),
  inputImagen: document.getElementById('input-imagen'),
  imagenAyuda: document.getElementById('imagen-ayuda'),
  formError: document.getElementById('form-error'),
};

let categoriaActivaId = '';

init();

async function init() {
  el.saludo.textContent = `Hola, ${usuarioNombre || 'usuario'}`;
  el.btnLogout.addEventListener('click', cerrarSesion);
  el.btnNuevoPost.addEventListener('click', () => toggleFormulario(true));
  el.btnCancelarPost.addEventListener('click', () => toggleFormulario(false));
  el.form.addEventListener('submit', onCrearPost);
  el.inputContenido.addEventListener('input', actualizarContador);
  el.inputImagen.addEventListener('change', onSeleccionarImagen);

  await cargarCategorias();
  await cargarFeed();
}

function cerrarSesion() {
  localStorage.removeItem('usuarioId');
  localStorage.removeItem('usuarioNombre');
  localStorage.removeItem('usuarioEmail');
  window.location.href = 'index.html';
}

// ----------------------------------------------------------
// Categorías (chips + <select> del formulario)
// ----------------------------------------------------------
async function cargarCategorias() {
  try {
    const res = await fetch(`${API}/categorias`);
    const categorias = await res.json();

    categorias.forEach((cat) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.dataset.categoriaId = cat.id;
      chip.textContent = cat.nombre;
      chip.addEventListener('click', () => seleccionarCategoria(cat.id));
      el.categoriaChips.appendChild(chip);

      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.nombre;
      el.inputCategoria.appendChild(option);
    });

    el.categoriaChips
      .querySelector('.chip')
      .addEventListener('click', () => seleccionarCategoria(''));
  } catch (error) {
    console.error('No se pudieron cargar las categorías', error);
  }
}

function seleccionarCategoria(id) {
  categoriaActivaId = id;
  [...el.categoriaChips.children].forEach((chip) => {
    chip.classList.toggle('is-active', (chip.dataset.categoriaId || '') === String(id));
  });
  cargarFeed();
}

// ----------------------------------------------------------
// Feed de posts
// ----------------------------------------------------------
async function cargarFeed() {
  el.feedCount.textContent = 'Cargando publicaciones…';
  el.feed.innerHTML = '';
  el.feedEmpty.hidden = true;

  try {
    const url = categoriaActivaId
      ? `${API}/posts?categoria_id=${categoriaActivaId}`
      : `${API}/posts`;
    const res = await fetch(url);
    const posts = await res.json();

    if (posts.length === 0) {
      el.feedCount.textContent = '0 publicaciones';
      el.feedEmpty.hidden = false;
      return;
    }

    el.feedCount.textContent = `${posts.length} publicación${posts.length === 1 ? '' : 'es'}`;
    posts.forEach((post) => el.feed.appendChild(crearTarjetaPost(post)));
  } catch (error) {
    console.error('No se pudo cargar el feed', error);
    el.feedCount.textContent = 'No se pudo cargar el feed. Revisa que el servidor esté corriendo.';
  }
}

function crearTarjetaPost(post) {
  const card = document.createElement('a');
  card.className = 'post-card';
  card.href = `post.html?id=${post.id}`;

  const fecha = new Date(post.fecha_creacion).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const badgeClase = post.estado === 'resuelta' ? 'badge-resuelta' : 'badge-pendiente';
  const badgeTexto = post.estado === 'resuelta' ? 'Resuelta' : 'Pendiente';

  card.innerHTML = `
    <div class="post-card-meta">
      <span class="post-card-categoria">${escapeHtml(post.categoria)}</span>
      <span>· ${escapeHtml(post.autor)}</span>
      <span>· ${fecha}</span>
      <span class="badge-estado ${badgeClase}">${badgeTexto}</span>
    </div>
    <h3>${escapeHtml(post.titulo)}</h3>
    <p>${escapeHtml(post.contenido)}</p>
    ${post.imagen_url ? `<img class="post-card-imagen" src="${post.imagen_url}" alt="Imagen de la publicación">` : ''}
    <div class="post-card-footer">
      ${post.total_comentarios} comentario${post.total_comentarios === 1 ? '' : 's'}
    </div>
  `;
  return card;
}

// ----------------------------------------------------------
// Crear post
// ----------------------------------------------------------
function toggleFormulario(mostrar) {
  el.postForm.hidden = !mostrar;
  el.formError.hidden = true;
  if (mostrar) {
    el.form.reset();
    actualizarContador();
    el.imagenAyuda.textContent = '';
    el.inputTitulo.focus();
  }
}

function actualizarContador() {
  const longitud = el.inputContenido.value.trim().length;
  el.contador.textContent = `${longitud} / ${MAX_CONTENIDO}`;
  const fueraDeRango = longitud > 0 && (longitud < MIN_CONTENIDO || longitud > MAX_CONTENIDO);
  el.contador.classList.toggle('contador-error', fueraDeRango);
}

function onSeleccionarImagen() {
  const archivo = el.inputImagen.files[0];
  if (!archivo) {
    el.imagenAyuda.textContent = '';
    return;
  }
  if (archivo.type !== 'image/png') {
    el.imagenAyuda.textContent = 'Solo se permiten imágenes .png';
    el.inputImagen.value = '';
    return;
  }
  el.imagenAyuda.textContent = `${archivo.name} (${(archivo.size / 1024 / 1024).toFixed(2)} MB)`;
}

async function onCrearPost(event) {
  event.preventDefault();
  el.formError.hidden = true;

  const contenido = el.inputContenido.value.trim();
  if (contenido.length < MIN_CONTENIDO || contenido.length > MAX_CONTENIDO) {
    el.formError.textContent = `El contenido debe tener entre ${MIN_CONTENIDO} y ${MAX_CONTENIDO} caracteres`;
    el.formError.hidden = false;
    return;
  }

  const formData = new FormData();
  formData.append('usuario_id', usuarioId);
  formData.append('categoria_id', el.inputCategoria.value);
  formData.append('titulo', el.inputTitulo.value.trim());
  formData.append('contenido', contenido);
  if (el.inputImagen.files[0]) {
    formData.append('imagen', el.inputImagen.files[0]);
  }

  try {
    const res = await fetch(`${API}/posts`, {
      method: 'POST',
      body: formData, // sin Content-Type manual: el navegador arma el boundary del multipart
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo crear el post');
    }

    toggleFormulario(false);
    seleccionarCategoria('');
  } catch (error) {
    el.formError.textContent = error.message;
    el.formError.hidden = false;
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
