const { pool } = require('../config/db');

// GET /api/notificaciones
async function getMisNotificaciones(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, post_id, mensaje, leida, fecha_creacion
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY fecha_creacion DESC
       LIMIT 15`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
}

// PUT /api/notificaciones/:id/leer
async function marcarLeida(req, res) {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?',
      [id, req.usuario.id]
    );
    res.json({ mensaje: 'Notificación marcada como leída' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
}

module.exports = { getMisNotificaciones, marcarLeida };