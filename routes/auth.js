// Ruta sugerida: backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';

// --- (Opcional) Endpoint para registrar un usuario/pin hasheado ---
// En producción esto se haría desde el panel web
router.post('/register', async (req, res) => {
  try {
    const { location_id, username, pin, full_name } = req.body;

    if (!username || !pin || !full_name || !location_id) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Hashear el PIN
    const salt = await bcrypt.genSalt(10);
    const pin_hash = await bcrypt.hash(pin, salt);

    const query = 'INSERT INTO users (location_id, username, pin_hash, full_name) VALUES (?, ?, ?, ?)';
    const [results] = await db.query(query, [location_id, username, pin_hash, full_name]);
    
    res.status(201).json({ message: 'Usuario registrado exitosamente', userId: results.insertId });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario', details: error.message });
  }
});


// --- Endpoint principal de Login ---
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, pin } = req.body;

    if (!username || !pin) {
      console.log('Username ' + username + ' intentó login sin pin');
      console.log('Pin ' + pin + ' intentó login sin username');
      return res.status(400).json({ error: 'Usuario y PIN son requeridos' });
    }

    // Buscamos al usuario y su ubicación asignada
    const query = `
      SELECT u.*, l.name as location_name
      FROM users u
      LEFT JOIN locations l ON u.location_id = l.id
      WHERE u.username = ? AND u.is_active = true
    `;

    const [results] = await db.query(query, [username]);

    // 1. Verificar si el usuario existe
    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas (usuario)' });
    }

    const user = results[0];

    // 2. Verificar el PIN
    const isPinMatch = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas (pin)' });
    }
    
    // 3. Verificar si tiene ubicación asignada
    if (!user.location_id || !user.location_name) {
      return res.status(403).json({ error: 'Usuario no tiene una ubicación asignada' });
    }

    // 4. Generar Token JWT
    const payload = {
      userId: user.id,
      username: user.username,
      locationId: user.location_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1d', // Token expira en 1 día
    });

    // Login exitoso
    res.json({
      message: 'Login exitoso',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        location_id: user.location_id,
        location_name: user.location_name
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor en autenticación' });
  }
});

module.exports = router;