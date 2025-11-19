const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Para variables de entorno (.env)

const db = require('../config/db'); // Configuración de la base de datos, ahora es pool de conexiones
const authRoutes = require('../routes/auth');
const itemsRoutes = require('../routes/items');
const locationsRoutes = require('../routes/locations');
const ticketsRoutes = require('../routes/tickets');
const usersRoutes = require('../routes/users');
const dashboardRoutes = require('../routes/dashboard');

const app = express();

// --- Conectar a la Base de Datos ---
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1); // Salir del proceso si no se puede conectar
  } else {
    console.log('Conexión a la base de datos establecida.');
    connection.release(); // Liberar la conexión de vuelta al pool
  }
});

// --- Middlewares ---
app.use(cors()); // Habilitar CORS para todas las rutas
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