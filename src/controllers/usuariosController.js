// src/controllers/usuariosController.js
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

// GET /api/usuarios
async function getUsuarios(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, fecha_registro, activo FROM usuarios'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

// GET /api/usuarios/:id
async function getUsuarioById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, nombre, email, rol, fecha_registro, activo FROM usuarios WHERE id = ?',
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

// POST /api/usuarios
// NOTA: aquí recibimos "password_hash" desde el front por compatibilidad con register.js,
// pero en realidad es la contraseña en texto plano — la hasheamos aquí antes de guardarla.
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

// PUT /api/usuarios/:id
async function actualizarUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nombre, email } = req.body;
    const [result] = await pool.query(
      'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
      [nombre, email, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
}

// DELETE /api/usuarios/:id
async function eliminarUsuario(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
}

module.exports = {
  getUsuarios,
  getUsuarioById,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
};
