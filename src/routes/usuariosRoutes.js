// src/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { autenticar, soloAdmin } = require('../middlewares/auth');

// Registro público (siempre crea cuentas con rol 'usuario')
router.post('/', usuariosController.crearUsuario);

// Solo admin
router.get('/', autenticar, soloAdmin, usuariosController.getUsuarios);
router.put('/:id/rol', autenticar, soloAdmin, usuariosController.asignarRol);
router.delete('/:id', autenticar, soloAdmin, usuariosController.eliminarUsuario);

// Con sesión: el propio usuario o un admin (se valida en el controlador)
router.get('/:id', autenticar, usuariosController.getUsuarioById);
router.put('/:id', autenticar, usuariosController.actualizarUsuario);

module.exports = router;