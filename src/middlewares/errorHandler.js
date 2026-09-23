// src/middlewares/errorHandler.js
// Middleware centralizado de manejo de errores (se coloca al final de server.js)

function errorHandler(err, req, res, next) {
  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
}

module.exports = errorHandler;
