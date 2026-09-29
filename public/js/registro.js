const formRegistro = document.getElementById('form-registro');
const campoNombre = document.getElementById('reg-nombre');
const campoEmailReg = document.getElementById('reg-email');
const campoPasswordReg = document.getElementById('reg-password');
const campoConfirmar = document.getElementById('reg-confirmar');
const mensajeEstadoReg = document.getElementById('reg-mensaje-estado');

formRegistro.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nombre = campoNombre.value.trim();
    const email = campoEmailReg.value;
    const password = campoPasswordReg.value;
    const confirmar = campoConfirmar.value;

    if (password !== confirmar) {
        mensajeEstadoReg.textContent = 'Las contraseñas no coinciden.';
        mensajeEstadoReg.style.color = 'red';
        return;
    }

    mensajeEstadoReg.textContent = 'Creando cuenta...';
    mensajeEstadoReg.style.color = 'black';

    try {
        // El backend recibe la contraseña en el campo password_hash y la encripta él mismo
        const respuesta = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password_hash: password })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mensajeEstadoReg.textContent = 'Cuenta creada correctamente. Ya puedes iniciar sesión.';
            mensajeEstadoReg.style.color = 'green';
            formRegistro.reset();

            setTimeout(() => {
                setMode('login');
            }, 900);
        } else {
            mensajeEstadoReg.textContent = `Error: ${datos.error}`;
            mensajeEstadoReg.style.color = 'red';
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        mensajeEstadoReg.textContent = 'No se pudo conectar con el servidor.';
        mensajeEstadoReg.style.color = 'red';
    }
});
