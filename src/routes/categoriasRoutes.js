// src/routes/categoriasRoutes.js
const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');

router.get('/', categoriasController.getCategorias);

module.exports = router;
