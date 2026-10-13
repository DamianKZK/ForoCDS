// src/routes/postsRoutes.js
const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const upload = require('../middlewares/upload');
const { autenticar, soloAdmin } = require('../middlewares/auth');

// Lectura pública
router.get('/', postsController.getPosts);
router.get('/:id', postsController.getPostById);

// Requieren sesión. En crear, "autenticar" va antes de "upload" para que
// nadie sin sesión pueda subir imágenes al servidor.
router.post('/', autenticar, upload.single('imagen'), postsController.crearPost);
router.put('/:id', autenticar, postsController.actualizarPost);
router.put('/:id/resolver', autenticar, postsController.marcarResuelto);

// Borrar: el dueño del post o un admin (la validación está en el controlador)
router.delete('/:id', autenticar, postsController.eliminarPost);

// Solo admin
router.put('/:id/destacar', autenticar, soloAdmin, postsController.destacarPost);
router.put('/:id/quitar-destacado', autenticar, soloAdmin, postsController.quitarDestacado);

module.exports = router;