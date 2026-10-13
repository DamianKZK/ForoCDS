// src/controllers/comentariosController.js
const { pool } = require('../config/db');

// POST /api/comentarios
// El autor sale del token (req.usuario), no de lo que mande el navegador.
async function crearComentario(req, res) {
  try {
    const { post_id, contenido } = req.body;
    if (!post_id || !contenido || !contenido.trim()) {
      return res.status(400).json({
        error: 'post_id y contenido son requeridos',
      });
    }
    const [result] = await pool.query(
      'INSERT INTO comentarios (post_id, usuario_id, contenido) VALUES (?, ?, ?)',
      [post_id, req.usuario.id, contenido.trim()]
    );
    res.status(201).json({ id: result.insertId, contenido: contenido.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el comentario' });
  }
}

// DELETE /api/comentarios/:id
// Puede borrarlo su autor o cualquier admin.
async function eliminarComentario(req, res) {
  try {
    const { id } = req.params;
    const [filas] = await pool.query('SELECT usuario_id FROM comentarios WHERE id = ?', [id]);
    if (filas.length === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    const esDueno = Number(filas[0].usuario_id) === Number(req.usuario.id);
    const esAdmin = req.usuario.rol === 'admin';
    if (!esDueno && !esAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }

    await pool.query('DELETE FROM comentarios WHERE id = ?', [id]);
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