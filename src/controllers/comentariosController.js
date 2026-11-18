// src/controllers/comentariosController.js
const { pool } = require('../config/db');

// POST /api/comentarios
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

    // Buscar al dueño del post
    const [posts] = await pool.query(
      'SELECT usuario_id, titulo FROM posts WHERE id = ? AND eliminado = 0',
      [post_id]
    );

    // Si existe el post y responde alguien distinto al autor, notificar
    if (posts.length > 0 && Number(posts[0].usuario_id) !== Number(req.usuario.id)) {
      const [[autor]] = await pool.query(
        'SELECT nombre FROM usuarios WHERE id = ?',
        [req.usuario.id]
      );
      const nombre = autor ? autor.nombre : 'Alguien';
      const mensaje = `${nombre} respondió a tu publicación: "${posts[0].titulo}"`;

      await pool.query(
        'INSERT INTO notificaciones (usuario_id, post_id, mensaje) VALUES (?, ?, ?)',
        [posts[0].usuario_id, post_id, mensaje]
      );
    }

    res.status(201).json({ id: result.insertId, contenido: contenido.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el comentario' });
  }
}

// DELETE /api/comentarios/:id
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