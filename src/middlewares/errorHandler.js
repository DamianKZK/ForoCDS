// src/middlewares/errorHandler.js
// Middleware centralizado de manejo de errores (se coloca al final de server.js)
const multer = require('multer');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = Number(process.env.MAX_UPLOAD_MB) || 5;
      return res.status(413).json({ error: `La imagen supera el límite de ${maxMb} MB` });
    }
    return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
  }

  if (err && err.message === 'Solo se permiten imágenes en formato .png') {
    return res.status(400).json({ error: err.message });
  }

  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
}

module.exports = errorHandler;
