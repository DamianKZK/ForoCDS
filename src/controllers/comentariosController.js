// src/controllers/comentariosController.js
const { pool } = require('../config/db');

// POST /api/comentarios
async function crearComentario(req, res) {
  try {
    const { post_id, usuario_id, contenido } = req.body;
    if (!post_id || !usuario_id || !contenido) {
      return res.status(400).json({
        error: 'post_id, usuario_id y contenido son requeridos',
      });
    }
    const [result] = await pool.query(
      'INSERT INTO comentarios (post_id, usuario_id, contenido) VALUES (?, ?, ?)',
      [post_id, usuario_id, contenido]
    );
    res.status(201).json({ id: result.insertId, contenido });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el comentario' });
  }
}

// DELETE /api/comentarios/:id
async function eliminarComentario(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM comentarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }
    res.json({ mensaje: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
}

module.exports = {
  crearComentario,
  eliminarComentario,
};
