// src/routes/comentariosRoutes.js
const express = require('express');
const router = express.Router();
const comentariosController = require('../controllers/comentariosController');
const { autenticar } = require('../middlewares/auth');

router.post('/', autenticar, comentariosController.crearComentario);
router.delete('/:id', autenticar, comentariosController.eliminarComentario);

module.exports = router;