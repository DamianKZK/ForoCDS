const registerForm = document.getElementById ('form-register');
const nameR = document.getElementById('name');
const fLastName = document.getElementById('father-lastname');
const mLastName = document.getElementById('mother-lastname');
const rEmail = document.getElementById('email');
const rUser = document.getElementById('username');
const rPassword = document.getElementById('password');
const confPassword = document.getElementById('confirm-password');
const registerMen = document.getElementById('estado-registro');

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
    else{
        console.log("padrino")

    }




});
