const registerForm = document.getElementById ('form-register');
const nameR = document.getElementById('name');
const fLastName = document.getElementById('father-lastname');
const mLastName = document.getElementById('mother-lastname');
const rEmail = document.getElementById('email');
const rUser = document.getElementById('username');
const rPassword = document.getElementById('password');
const confPassword = document.getElementById('confirm-password');
const registerMen = document.getElementById('mensaje-estado');

registerForm.addEventListener('submit', async (evento)=>{
    evento.preventDefault();
    const nombre = nameR.value;
    const apellidoP = fLastName.value;
    const apellidoM = mLastName.value;
    const emailR = rEmail.value;
    const user = rUser.value;
    const password = rPassword.value;
    const cPassword = confPassword.value;

    registerMen.textContent = "Verificando datos...";
    registerMen.style.color = 'black';

    if (password != cPassword){
        console.log("No papi");
        registerMen.textContent = "Las contraseñas no coinciden";
        registerMen.style.color = 'red';
        return;
    }
    else if (password.length<7 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)){
        console.log("No papi");
        registerMen.textContent = "La contraseña debe contener al menos una letra, un numero y por lo menos 7 caracteres";
        registerMen.style.color = 'red';
        return;
    }

    const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`.trim();
    try{
        registerMen.textContent = "Creando cuenta...";
        registerMen.style.color = "black";

        //Aqui se hace la peticion  POST
        const respuesta = await fetch ('api/usuarios', {
            method: 'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombreCompleto,
                email: emailR,
                password_hash: password
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            registerMen.textContent = datos.error || "No se pudo registrar el usuario.";
            registerMen.style.color = "red";
            return;
        }

        registerMen.textContent = "¡Usuario registrado con éxito! Redirigiendo...";
        registerMen.style.color = "green";

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error("Error en la petición:", error);
        registerMen.textContent = "Error al conectar con el servidor.";
        registerMen.style.color = "red";
    }
    
});
