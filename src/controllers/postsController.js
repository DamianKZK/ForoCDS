// src/controllers/postsController.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIN_CONTENIDO = 20;
const MAX_CONTENIDO = 150;

// GET /api/posts  (con datos del autor y la categoría; admite ?categoria_id= para filtrar)
// Los posts eliminados no se muestran, y los destacados salen primero
// (incluso si son de otra categoría).
async function getPosts(req, res) {
  try {
    const { categoria_id } = req.query;
    const params = [];
    let filtro = 'WHERE p.eliminado = 0';
    if (categoria_id) {
      filtro += ' AND (p.categoria_id = ? OR p.destacado = 1)';
      params.push(categoria_id);
    }
    const [rows] = await pool.query(`
      SELECT p.id, p.titulo, p.contenido, p.imagen_url, p.estado,
             p.fecha_creacion, p.vistas, p.cerrado, p.destacado,
             u.id AS usuario_id, u.nombre AS autor,
             u.rol AS autor_rol, u.cargo AS autor_cargo,
             c.id AS categoria_id, c.nombre AS categoria,
             (SELECT COUNT(*) FROM comentarios cm WHERE cm.post_id = p.id) AS total_comentarios
      FROM posts p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN categorias c ON p.categoria_id = c.id
      ${filtro}
      ORDER BY p.destacado DESC, p.fecha_creacion DESC
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
      SELECT p.id, p.titulo, p.contenido, p.imagen_url, p.estado,
             p.fecha_creacion, p.vistas, p.cerrado, p.destacado,
             u.id AS usuario_id, u.nombre AS autor,
             u.rol AS autor_rol, u.cargo AS autor_cargo,
             c.id AS categoria_id, c.nombre AS categoria
      FROM posts p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = ? AND p.eliminado = 0
    `, [id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const [comentarios] = await pool.query(`
      SELECT cm.id, cm.contenido, cm.fecha_creacion,
             u.id AS usuario_id, u.nombre AS autor,
             u.rol AS autor_rol, u.cargo AS autor_cargo
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
// Espera multipart/form-data (por la imagen opcional). req.file lo llena multer.
// El autor sale del token (req.usuario), no de lo que mande el navegador.
async function crearPost(req, res) {
  try {
    const { categoria_id, titulo, contenido } = req.body;

    if (!categoria_id || !titulo || !contenido) {
      borrarArchivoSiExiste(req.file);
      return res.status(400).json({
        error: 'categoria_id, titulo y contenido son requeridos',
      });
    }

    const longitud = contenido.trim().length;
    if (longitud < MIN_CONTENIDO || longitud > MAX_CONTENIDO) {
      borrarArchivoSiExiste(req.file);
      return res.status(400).json({
        error: `El contenido debe tener entre ${MIN_CONTENIDO} y ${MAX_CONTENIDO} caracteres (tiene ${longitud})`,
      });
    }

    const imagenUrl = req.file ? `/uploads/posts/${req.file.filename}` : null;

    const [result] = await pool.query(
      'INSERT INTO posts (usuario_id, categoria_id, titulo, contenido, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [req.usuario.id, categoria_id, titulo.trim(), contenido.trim(), imagenUrl]
    );
    res.status(201).json({ id: result.insertId, titulo, contenido, imagen_url: imagenUrl, estado: 'pendiente' });
  } catch (error) {
    borrarArchivoSiExiste(req.file);
    console.error(error);
    res.status(500).json({ error: 'Error al crear el post' });
  }
}

// PUT /api/posts/:id
// Solo el autor del post puede editarlo.
async function actualizarPost(req, res) {
  try {
    const { id } = req.params;
    const { titulo, contenido } = req.body;

    if (!titulo || !titulo.trim() || !contenido) {
      return res.status(400).json({ error: 'titulo y contenido son requeridos' });
    }

    const longitud = contenido.trim().length;
    if (longitud < MIN_CONTENIDO || longitud > MAX_CONTENIDO) {
      return res.status(400).json({
        error: `El contenido debe tener entre ${MIN_CONTENIDO} y ${MAX_CONTENIDO} caracteres (tiene ${longitud})`,
      });
    }

    const [posts] = await pool.query(
      'SELECT usuario_id FROM posts WHERE id = ? AND eliminado = 0',
      [id]
    );
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    if (Number(posts[0].usuario_id) !== Number(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo el autor puede editar este post' });
    }

    await pool.query(
      'UPDATE posts SET titulo = ?, contenido = ? WHERE id = ?',
      [titulo.trim(), contenido.trim(), id]
    );
    res.json({ mensaje: 'Post actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el post' });
  }
}

// PUT /api/posts/:id/resolver
// Solo el autor del post puede marcarlo como resuelto.
async function marcarResuelto(req, res) {
  try {
    const { id } = req.params;

    const [posts] = await pool.query(
      'SELECT usuario_id FROM posts WHERE id = ? AND eliminado = 0',
      [id]
    );
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    if (Number(posts[0].usuario_id) !== Number(req.usuario.id)) {
      return res.status(403).json({ error: 'Solo el autor del post puede marcarlo como resuelto' });
    }

    await pool.query("UPDATE posts SET estado = 'resuelta' WHERE id = ?", [id]);
    res.json({ mensaje: 'Post marcado como resuelto' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el estado del post' });
  }
}

// DELETE /api/posts/:id
// Borrado lógico: el post no se borra de la BD, solo se marca como eliminado.
// Puede hacerlo el dueño del post o cualquier admin.
async function eliminarPost(req, res) {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Debes iniciar sesión.' });
    }

    const { id } = req.params;
    const [posts] = await pool.query(
      'SELECT usuario_id FROM posts WHERE id = ? AND eliminado = 0',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const esDueno = Number(posts[0].usuario_id) === Number(req.usuario.id);
    const esAdmin = req.usuario.rol === 'admin';

    if (!esDueno && !esAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
    }

    await pool.query(
      'UPDATE posts SET eliminado = 1, eliminado_por = ?, fecha_eliminado = NOW() WHERE id = ?',
      [req.usuario.id, id]
    );
    res.json({ mensaje: 'Post eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
}

// PUT /api/posts/:id/destacar   (solo admin)
const MAX_DESTACADOS = 3;

async function destacarPost(req, res) {
  try {
    const { id } = req.params;

    const [posts] = await pool.query(
      'SELECT destacado FROM posts WHERE id = ? AND eliminado = 0',
      [id]
    );
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    if (posts[0].destacado) {
      return res.json({ mensaje: 'El post ya estaba destacado' });
    }

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM posts WHERE destacado = 1 AND eliminado = 0'
    );
    if (total >= MAX_DESTACADOS) {
      return res.status(400).json({
        error: `Solo puede haber ${MAX_DESTACADOS} posts destacados a la vez. Quita uno primero.`,
      });
    }

    await pool.query(
      'UPDATE posts SET destacado = 1, destacado_por = ?, fecha_destacado = NOW() WHERE id = ?',
      [req.usuario.id, id]
    );
    res.json({ mensaje: 'Post destacado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al destacar el post' });
  }
}

// PUT /api/posts/:id/quitar-destacado   (solo admin)
async function quitarDestacado(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'UPDATE posts SET destacado = 0, destacado_por = NULL, fecha_destacado = NULL WHERE id = ? AND eliminado = 0',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }
    res.json({ mensaje: 'Se quitó el destacado del post' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al quitar el destacado' });
  }
}

// Si algo falla después de que multer ya guardó el archivo, lo borramos
// para no dejar imágenes huérfanas en el disco.
function borrarArchivoSiExiste(file) {
  if (file) {
    fs.unlink(path.join(file.destination, file.filename), () => {});
  }
}

module.exports = {
  getPosts,
  getPostById,
  crearPost,
  actualizarPost,
  marcarResuelto,
  eliminarPost,
  destacarPost,
  quitarDestacado,
};