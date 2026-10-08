// src/controllers/categoriasController.js
const { pool } = require('../config/db');

// GET /api/categorias
async function getCategorias(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, descripcion FROM categorias ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
}

module.exports = { getCategorias };
