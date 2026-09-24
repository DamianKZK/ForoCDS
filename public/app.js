const formLogin = document.getElementById('form-login');
const campoEmail = document.getElementById('campo-email');
const campoPassword = document.getElementById('campo-password');
const mensajeEstado = document.getElementById('mensaje-estado');
const botonRegistro = document.getElementById('registro-boton');

formLogin.addEventListener('submit', async (evento) =>{
    evento.preventDefault();

    const email = campoEmail.value;
    const password = campoPassword.value;

    mensajeEstado.textContent = 'Verificando credenciales...';
    mensajeEstado.style.color = 'black';

    try {
        //Enviamos los datos al backend usando una petición HTTP POST
        const respuesta = await fetch('/api/login', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json' //Similar a un diccionario en python, le estamos diciendo al back que el tipo de dato que se le va a mandar es un .json
        },
        body: JSON.stringify({ email, password }) // Convertimos el objeto JS a texto plano JSON
    });
    // 5. Convertimos la respuesta que nos regrese el backend a un objeto JavaScript
    const datos = await respuesta.json();

    // 6. Evaluamos el resultado que nos dio el servidor
    if (respuesta.ok) {
      // Código HTTP 200 (Éxito)
        mensajeEstado.textContent = `¡Bienvenido! ${datos.mensaje}`;
        mensajeEstado.style.color = 'green';
    } else {
      // Código HTTP 401, 400, 500, etc. (Fallo)
        mensajeEstado.textContent = `Error: ${datos.error}`;
        mensajeEstado.style.color = 'red';
    }
    } catch (error) {
    // Si el servidor está apagado o la red se cayó por completo
        console.error('Error de conexión:', error);
        mensajeEstado.textContent = 'No se pudo conectar con el servidor.';
        mensajeEstado.style.color = 'red';
    }
});