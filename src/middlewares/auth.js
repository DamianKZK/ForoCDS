const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Identifica quién hace la petición a partir del token
async function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión.' });
  }

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    // El rol se lee de la BD en cada petición: si le quitas admin a alguien,
    // pierde los permisos al instante, sin esperar a que caduque su token.
    const [filas] = await pool.query(
      'SELECT id, nombre, email, rol, cargo FROM usuarios WHERE id = ?',
      [id]
    );

    if (filas.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    req.usuario = filas[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

// Debe usarse después de autenticar
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los administradores pueden hacer esto.' });
  }
  next();
}

module.exports = { autenticar, soloAdmin };