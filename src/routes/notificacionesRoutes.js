const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const { autenticar } = require('../middlewares/auth');

router.get('/', autenticar, notificacionesController.getMisNotificaciones);
router.put('/:id/leer', autenticar, notificacionesController.marcarLeida);

module.exports = router;