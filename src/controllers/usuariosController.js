// src/controllers/usuariosController.js
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

// GET /api/usuarios   (solo admin)
async function getUsuarios(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, cargo, fecha_registro, activo FROM usuarios ORDER BY nombre'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

// GET /api/usuarios/:id   (el propio usuario o un admin)
async function getUsuarioById(req, res) {
  try {
    const { id } = req.params;
    if (Number(id) !== Number(req.usuario.id) && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para ver este usuario' });
    }
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, cargo, fecha_registro, activo FROM usuarios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
}

// POST /api/usuarios   (registro público)
// NOTA: aquí recibimos "password_hash" desde el front por compatibilidad con register.js,
// pero en realidad es la contraseña en texto plano — la hasheamos aquí antes de guardarla.
// El rol NO se toma del body: la columna tiene valor por defecto 'usuario'.
async function crearUsuario(req, res) {
  try {
    const { nombre, email, password_hash } = req.body;
    if (!nombre || !email || !password_hash) {
      return res.status(400).json({ error: 'nombre, email y password_hash son requeridos' });
    }

    const hash = await bcrypt.hash(password_hash, SALT_ROUNDS);

    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)',
      [nombre, email, hash]
    );
    res.status(201).json({ id: result.insertId, nombre, email });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
}

// PUT /api/usuarios/:id   (el propio usuario o un admin)
async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nombre, email } = req.body;

    if (Number(id) !== Number(req.usuario.id) && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para editar este usuario' });
    }
    if (!nombre || !nombre.trim() || !email || !email.trim()) {
      return res.status(400).json({ error: 'nombre y email son requeridos' });
    }

    const [result] = await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
      [nombre.trim(), email.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

// PUT /api/usuarios/:id/rol   (solo admin)
// Ascender a admin (con cargo) o regresar a usuario normal.
async function asignarRol(req, res) {
  try {
    const { id } = req.params;
    const { rol, cargo } = req.body;

    if (!['usuario', 'admin'].includes(rol)) {
      return res.status(400).json({ error: "rol debe ser 'usuario' o 'admin'" });
    }
    if (rol === 'admin' && !['comite', 'coordinador'].includes(cargo)) {
      return res.status(400).json({ error: "Un admin necesita cargo: 'comite' o 'coordinador'" });
    }
    if (Number(id) === Number(req.usuario.id)) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const nuevoCargo = rol === 'admin' ? cargo : null;
    const [result] = await pool.query(
      'UPDATE usuarios SET rol = ?, cargo = ? WHERE id = ?',
      [rol, nuevoCargo, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Rol actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al asignar el rol' });
  }
}

// DELETE /api/usuarios/:id   (solo admin)
async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.usuario.id)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'No se puede eliminar: el usuario tiene publicaciones o comentarios.' });
    }
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
}

module.exports = {
  getUsuarios,
  getUsuarioById,
  crearUsuario,
  actualizarUsuario,
  asignarRol,
  eliminarUsuario,
};