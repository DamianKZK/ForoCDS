// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const { testConnection } = require('./src/config/db');
const errorHandler = require('./src/middlewares/errorHandler');

const usuariosRoutes = require('./src/routes/usuariosRoutes');
const postsRoutes = require('./src/routes/postsRoutes');
const comentariosRoutes = require('./src/routes/comentariosRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión temporal a MariaDB para login
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'ForoCDS API funcionando correctamente' });
});

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comentarios', comentariosRoutes);

// Ruta para procesar el login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Debes ingresar correo y contraseña.' });
  }

  try {
    const [filas] = await pool.query(
      'SELECT id, email, password_hash FROM usuarios WHERE email = ?',
      [email]
    );

    if (filas.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const usuario = filas[0];

    if (usuario.password_hash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    return res.json({
      mensaje: `Sesión iniciada correctamente como ${usuario.email}`,
      usuarioId: usuario.id
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