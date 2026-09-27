// src/middlewares/upload.js
// Middleware de subida de imágenes para los posts, usando multer.
// El límite de tamaño se controla con MAX_UPLOAD_MB en el .env (por default 5 MB).

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const CARPETA_DESTINO = path.join(__dirname, '..', '..', 'public', 'uploads', 'posts');

// Asegura que la carpeta exista (por si se clona el repo desde cero)
if (!fs.existsSync(CARPETA_DESTINO)) {
  fs.mkdirSync(CARPETA_DESTINO, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CARPETA_DESTINO),
  filename: (req, file, cb) => {
    const sufijo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sufijo}.png`);
  },
});

function filtroArchivo(req, file, cb) {
  const esPng = file.mimetype === 'image/png';
  if (!esPng) {
    return cb(new Error('Solo se permiten imágenes en formato .png'));
  }
  cb(null, true);
}

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 5;

const upload = multer({
  storage,
  fileFilter: filtroArchivo,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

module.exports = upload;
