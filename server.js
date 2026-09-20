require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conexión a MariaDB
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Ruta para procesar el login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Validación: campos no vacíos
  if (!email || !password) {
    return res.status(400).json({ error: 'Debes ingresar correo y contraseña.' });
  }

  try {
    // 1. Buscamos si existe el correo en la tabla 'cuentas'
    const [filas] = await pool.query(
      'SELECT id, email, password FROM cuentas WHERE email = ?',
      [email]
    );

    // Si el arreglo viene vacío, el correo no está registrado
    if (filas.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const usuario = filas[0];

    // 2. Comparamos la contraseña recibida con la de la base de datos
    if (usuario.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 3. Si todo coincide, respondemos éxito (Código 200)
    return res.json({
      mensaje: `Sesión iniciada correctamente como ${usuario.email}`,
      usuarioId: usuario.id
    });

  } catch (error) {
    console.error('Error en la base de datos:', error);
    return res.status(500).json({ error: 'Error del servidor al procesar el login.' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor activo en: http://localhost:${PORT}`);
});