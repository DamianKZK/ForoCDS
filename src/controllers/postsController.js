// src/controllers/postsController.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const MIN_CONTENIDO = 20;
const MAX_CONTENIDO = 150;

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
      SELECT p.id, p.titulo, p.contenido, p.imagen_url, p.estado,
             p.fecha_creacion, p.vistas, p.cerrado,
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
      SELECT p.id, p.titulo, p.contenido, p.imagen_url, p.estado,
             p.fecha_creacion, p.vistas, p.cerrado,
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
// Espera multipart/form-data (por la imagen opcional). req.file lo llena multer.
async function crearPost(req, res) {
  try {
    const { usuario_id, categoria_id, titulo, contenido } = req.body;

    if (!usuario_id || !categoria_id || !titulo || !contenido) {
      borrarArchivoSiExiste(req.file);
      return res.status(400).json({
        error: 'usuario_id, categoria_id, titulo y contenido son requeridos',
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
      [usuario_id, categoria_id, titulo, contenido.trim(), imagenUrl]
    );
    res.status(201).json({ id: result.insertId, titulo, contenido, imagen_url: imagenUrl, estado: 'pendiente' });
  } catch (error) {
    borrarArchivoSiExiste(req.file);
    console.error(error);
    res.status(500).json({ error: 'Error al crear el post' });
  }
}

// PUT /api/posts/:id
async function actualizarPost(req, res) {
  try {
    const { id } = req.params;
    const { titulo, contenido } = req.body;

    if (contenido) {
      const longitud = contenido.trim().length;
      if (longitud < MIN_CONTENIDO || longitud > MAX_CONTENIDO) {
        return res.status(400).json({
          error: `El contenido debe tener entre ${MIN_CONTENIDO} y ${MAX_CONTENIDO} caracteres (tiene ${longitud})`,
        });
      }
    }

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

// PUT /api/posts/:id/resolver
// Solo el autor del post puede marcarlo como resuelto.
// NOTA: como todavía no hay sesión real (JWT/tokens), esto solo compara el
// usuario_id que manda el front contra el dueño del post. No es una
// validación de seguridad robusta — cuando tu compañero termine el sistema
// de sesiones/roles, esto se debe reforzar con el usuario autenticado real.
async function marcarResuelto(req, res) {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ error: 'usuario_id es requerido' });
    }

    const [posts] = await pool.query('SELECT usuario_id, estado FROM posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    if (Number(posts[0].usuario_id) !== Number(usuario_id)) {
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
};
