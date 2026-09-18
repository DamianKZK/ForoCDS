// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
app.use(express.static('public')); // sirve el frontend cuando exista

// Ruta de salud, útil para confirmar que el servidor levanta bien
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mensaje: 'ForoCDS API funcionando correctamente' });
});

// Rutas de la API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comentarios', comentariosRoutes);

// Middleware de manejo de errores (siempre al final)
app.use(errorHandler);

// Arrancar el servidor solo después de confirmar la conexión a la BD
testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
});
