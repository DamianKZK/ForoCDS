// src/routes/postsRoutes.js
const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const upload = require('../middlewares/upload');

router.get('/', postsController.getPosts);
router.get('/:id', postsController.getPostById);
router.post('/', upload.single('imagen'), postsController.crearPost);
router.put('/:id', postsController.actualizarPost);
router.put('/:id/resolver', postsController.marcarResuelto);
router.delete('/:id', postsController.eliminarPost);

module.exports = router;
