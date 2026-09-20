// src/routes/postsRoutes.js
const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');

router.get('/', postsController.getPosts);
router.get('/:id', postsController.getPostById);
router.post('/', postsController.crearPost);
router.put('/:id', postsController.actualizarPost);
router.delete('/:id', postsController.eliminarPost);

module.exports = router;
