// src/controllers/postsController.js
const { pool } = require('../config/db');

// GET /api/posts  (con datos del autor y la categoría; admite ?categoria_id= para filtrar)
async function getPosts(req, res) {
  try {
    const { categoria_id } = req.query;
    const params = [];
    let filtro = '';
    if (categoria_id) {
      filtro = 'WHERE p.categoria_id = ?';
      params.push(categoria_id);
    }
    const [rows] = await pool.query(`
      SELECT p.id, p.titulo, p.contenido, p.fecha_creacion, p.vistas, p.cerrado,
             u.id AS usuario_id, u.nombre AS autor,
             c.id AS categoria_id, c.nombre AS categoria,
             (SELECT COUNT(*) FROM comentarios cm WHERE cm.post_id = p.id) AS total_comentarios
      FROM posts p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN categorias c ON p.categoria_id = c.id
      ${filtro}
      ORDER BY p.fecha_creacion DESC
    `, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
}

// GET /api/posts/:id  (incluye comentarios)
async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const [posts] = await pool.query(`
      SELECT p.id, p.titulo, p.contenido, p.fecha_creacion, p.vistas, p.cerrado,
             u.id AS usuario_id, u.nombre AS autor,
             c.id AS categoria_id, c.nombre AS categoria
      FROM posts p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const [comentarios] = await pool.query(`
      SELECT cm.id, cm.contenido, cm.fecha_creacion, u.id AS usuario_id, u.nombre AS autor
      FROM comentarios cm
      JOIN usuarios u ON cm.usuario_id = u.id
      WHERE cm.post_id = ?
      ORDER BY cm.fecha_creacion ASC
    `, [id]);

    res.json({ ...posts[0], comentarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el post' });
  }
}

// POST /api/posts
async function crearPost(req, res) {
  try {
    const { usuario_id, categoria_id, titulo, contenido } = req.body;
    if (!usuario_id || !categoria_id || !titulo || !contenido) {
      return res.status(400).json({
        error: 'usuario_id, categoria_id, titulo y contenido son requeridos',
      });
    }
    const [result] = await pool.query(
      'INSERT INTO posts (usuario_id, categoria_id, titulo, contenido) VALUES (?, ?, ?, ?)',
      [usuario_id, categoria_id, titulo, contenido]
    );
    res.status(201).json({ id: result.insertId, titulo, contenido });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el post' });
  }
}

// PUT /api/posts/:id
async function actualizarPost(req, res) {
  try {
    const { id } = req.params;
    const { titulo, contenido } = req.body;
    const [result] = await pool.query(
      'UPDATE posts SET titulo = ?, contenido = ? WHERE id = ?',
      [titulo, contenido, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    res.json({ mensaje: 'Post actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el post' });
  }
}

// DELETE /api/posts/:id
async function eliminarPost(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    res.json({ mensaje: 'Post eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
}

module.exports = {
  getPosts,
  getPostById,
  crearPost,
  actualizarPost,
  eliminarPost,
};
