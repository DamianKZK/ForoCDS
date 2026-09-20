// src/config/db.js
// Pool de conexiones a MySQL usando mysql2/promise para poder usar async/await

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forocds',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función auxiliar para probar la conexión al iniciar el servidor
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
