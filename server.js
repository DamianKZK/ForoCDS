// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const { pool, testConnection } = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');

const usuariosRoutes = require('./src/routes/usuariosRoutes');
const postsRoutes = require('./src/routes/postsRoutes');
const comentariosRoutes = require('./src/routes/comentariosRoutes');
const categoriasRoutes = require('./src/routes/categoriasRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'ForoCDS API funcionando correctamente' });
});

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/categorias', categoriasRoutes);

// Ruta para procesar el login
// Usa el mismo pool de src/config/db.js — ya no se crea una conexión aparte aquí.
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes ingresar correo y contraseña.' });
  }

  try {
    const [filas] = await pool.query(
      'SELECT id, nombre, email, password_hash FROM usuarios WHERE email = ?',
      [email]
    );

    if (filas.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const usuario = filas[0];
    const coincide = await bcrypt.compare(password, usuario.password_hash);

    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    return res.json({
      mensaje: `Sesión iniciada correctamente como ${usuario.email}`,
      usuarioId: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
    });
  } catch (error) {
    console.error('Error en la base de datos:', error);
    return res.status(500).json({ error: 'Error del servidor al procesar el login.' });
  }
});

// Middleware de manejo de errores
app.use(errorHandler);

// Arrancar el servidor
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
