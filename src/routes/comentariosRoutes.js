// src/routes/comentariosRoutes.js
const express = require('express');
const router = express.Router();
const comentariosController = require('../controllers/comentariosController');

router.post('/', comentariosController.crearComentario);
router.delete('/:id', comentariosController.eliminarComentario);

module.exports = router;
