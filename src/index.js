const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Para variables de entorno (.env)

const db = require('../config/db'); // Configuración de la base de datos, ahora es pool de conexiones
const authRoutes = require('../routes/auth');
const itemsRoutes = require('../routes/items');
const categoriesRoutes = require('../routes/categories');
const locationsRoutes = require('../routes/locations');
const ticketsRoutes = require('../routes/tickets');
const usersRoutes = require('../routes/users');
const dashboardRoutes = require('../routes/dashboard');

const app = express();

// --- Conectar a la Base de Datos ---
/*
db.getConnection
  .then(connection => {
    console.log('Conexión a la base de datos establecida.');
    connection.release(); // Liberar la conexión después de probarla
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1); // Salir si no se puede conectar a la base de datos
  });
*/

async function testConnection() {
  try {
    const conn = await db.getConnection();
    console.log('Conexión a la base de datos establecida desde index.');
    conn.release();
  } catch (err) {
      console.error('Error al conectar a la base de datos:', err.message);
    }
}

testConnection();

const allowedOrigins = [
       'https://interno.metrocuadrado.com.sv',  
       'http://localhost:5173',
       'http://localhost:3000'
    ];

// --- Middlewares ---
app.use(cors({
  origin: function (origin, callback) {
    // permitimos peticiones sin origen (como aplicaciones móviles o curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
   methods: ['GET', 'POST', 'PUT', 'DELETE'],
   credentials: true // Habilitalo si usás Cookies o Sessions
}));

app.use(express.json({ limit: '10mb' })); // Middleware para parsear JSON (aumentamos limite para iconos)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Rutas ---
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de TuriCash v1.0' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Otras rutas
app.use('/api/locations', locationsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);


// --- Manejador de errores simple ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Algo salió mal en el servidor.' });
});

// --- Iniciar Servidor ---
const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor TuriCash corriendo en http://localhost:${PORT}`);
});