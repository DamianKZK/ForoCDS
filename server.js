const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Sirve el HTML/CSS/JS de la carpeta public

// Pool de conexión a MariaDB
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Probar conexión
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MariaDB:', err.message);
  } else {
    console.log('✅ Conexión exitosa a la base de datos baseCalidad');
    connection.release();
  }
});

// Endpoint GET: Obtener los usuarios guardados
app.get('/api/usuarios', (req, res) => {
  db.query('SELECT * FROM usuarios', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint POST: Registrar un usuario nuevo
app.post('/api/usuarios', (req, res) => {
  const { nombre, email } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son requeridos' });
  }

  db.query(
    'INSERT INTO usuarios (nombre, email) VALUES (?, ?)',
    [nombre, email],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: result.insertId, nombre, email });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});