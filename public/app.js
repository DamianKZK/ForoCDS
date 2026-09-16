const form = document.getElementById('form-usuario');
const lista = document.getElementById('lista-usuarios');

// Cargar y mostrar usuarios desde la base de datos
async function cargarUsuarios() {
  try {
    const respuesta = await fetch('/api/usuarios');
    const usuarios = await respuesta.json();

    lista.innerHTML = '';
    usuarios.forEach((usuario) => {
      const li = document.createElement('li');
      li.textContent = `${usuario.nombre} — ${usuario.email}`;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
  }
}

// Enviar nuevo usuario al backend
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;

  try {
    const respuesta = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email })
    });

    if (respuesta.ok) {
      form.reset();
      cargarUsuarios(); // Recarga la lista automáticamente
    } else {
      const errData = await respuesta.json();
      alert(`Error: ${errData.error}`);
    }
  } catch (error) {
    console.error('Error al guardar usuario:', error);
  }
});

// Llamada inicial al cargar la página
cargarUsuarios();