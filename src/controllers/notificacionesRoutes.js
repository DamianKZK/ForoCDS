// src/routes/notificacionesRoutes.js
const express = require('express');
const router = express.Router();
const { getMisNotificaciones, marcarLeida } = require('../controllers/notificacionesController');
// Importa aquí tu middleware de autenticación tal como en postsRoutes.js
// const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', /* verificarToken, */ getMisNotificaciones);
router.put('/:id/leer', /* verificarToken, */ marcarLeida);

module.exports = router;