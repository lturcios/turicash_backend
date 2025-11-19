// Ruta sugerida: backend/routes/users.js
const express = require('express');
const router = express.Router();
const dbPool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);

// --- GET /api/users ---
router.get('/', async (req, res) => {
  const query = `
    SELECT u.id, u.username, u.full_name, u.location_id, u.is_active, l.name as location_name 
    FROM users u 
    LEFT JOIN locations l ON u.location_id = l.id
    ORDER BY u.full_name ASC
  `;
  try {
    const [users] = await dbPool.query(query);
    res.json(users);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// --- POST /api/users (Crear) ---
router.post('/', async (req, res) => {
  const { username, pin, full_name, location_id, is_active } = req.body;
  if (!username || !pin || !full_name) {
    return res.status(400).json({ error: 'Usuario, PIN y Nombre completo son requeridos.' });
  }

  try {
    // Hashear el PIN
    const salt = await bcrypt.genSalt(10);
    const pin_hash = await bcrypt.hash(pin, salt);

    const query = `
      INSERT INTO users (username, pin_hash, full_name, location_id, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await dbPool.execute(query, [username, pin_hash, full_name, location_id || null, is_active === undefined ? true : is_active]);
    res.status(201).json({ message: 'Usuario creado', id: result.insertId });
  } catch (err) {
    console.error('Error al crear usuario:', err);
     if (err.code === 'ER_DUP_ENTRY') {
         return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
    }
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- PUT /api/users/:id (Actualizar) ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, pin, full_name, location_id, is_active } = req.body;

  if (!username || !full_name) {
    return res.status(400).json({ error: 'Usuario y Nombre completo son requeridos.' });
  }

  try {
    let query;
    let params;

    if (pin && pin.length >= 4) {
      // Si se provee un nuevo PIN, hashearlo y actualizarlo
      const salt = await bcrypt.genSalt(10);
      const pin_hash = await bcrypt.hash(pin, salt);
      query = `
        UPDATE users SET 
        username = ?, pin_hash = ?, full_name = ?, location_id = ?, is_active = ?
        WHERE id = ?
      `;
      params = [username, pin_hash, full_name, location_id || null, is_active, id];
    } else {
      // Si no se provee PIN, actualizar el resto de datos
      query = `
        UPDATE users SET 
        username = ?, full_name = ?, location_id = ?, is_active = ?
        WHERE id = ?
      `;
      params = [username, full_name, location_id || null, is_active, id];
    }

    const [result] = await dbPool.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
     if (err.code === 'ER_DUP_ENTRY') {
         return res.status(400).json({ error: 'El nombre de usuario ya existe.' });
    }
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- DELETE /api/users/:id ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';
  try {
    const [result] = await dbPool.execute(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
         return res.status(400).json({ error: 'No se puede eliminar: El usuario ya tiene tickets emitidos.' });
    }
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

module.exports = router;