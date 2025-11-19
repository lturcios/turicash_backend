const mysql = require('mysql2/promise'); 
require('dotenv').config();

// Configuración de la conexión a MySQL
// Es MUY recomendable usar variables de entorno (.env) para esto
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 20000
});

// Verificamos la conexión al crear el pool
pool.getConnection()
    .then(connection => {
        console.log('Conectado exitosamente a la base de datos MySQL (Pool).');
        connection.release(); // Soltar la conexión
    })
    .catch(err => {
        console.error('Error conectando a MySQL:', err);
    });

module.exports = pool;