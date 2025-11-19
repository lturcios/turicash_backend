// Ruta sugerida: backend/routes/locations.js
const express = require('express');
const router = express.Router();
const dbPool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Proteger rutas
router.use(authMiddleware);

// --- GET /api/locations ---
router.get('/', async (req, res) => {
  const query = 'SELECT * FROM locations ORDER BY name ASC';
  try {
    const [results] = await dbPool.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener ubicaciones:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// --- POST /api/locations ---
router.post('/', async (req, res) => {
  const { name, is_active } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido.' });
  }
  const query = 'INSERT INTO locations (name, is_active) VALUES (?, ?)';
  try {
    const [result] = await dbPool.execute(query, [name, is_active === undefined ? true : is_active]);
    res.status(201).json({ message: 'Ubicación creada', id: result.insertId });
  } catch (err) {
    console.error('Error al crear ubicación:', err);
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- PUT /api/locations/:id ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido.' });
  }
  const query = 'UPDATE locations SET name = ?, is_active = ? WHERE id = ?';
  try {
    const [result] = await dbPool.execute(query, [name, is_active, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ubicación no encontrada.' });
    }
    res.json({ message: 'Ubicación actualizada' });
  } catch (err) {
    console.error('Error al actualizar ubicación:', err);
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- DELETE /api/locations/:id ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM locations WHERE id = ?';
  try {
    const [result] = await dbPool.execute(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ubicación no encontrada.' });
    }
    res.json({ message: 'Ubicación eliminada' });
  } catch (err) {
    console.error('Error al eliminar ubicación:', err);
     if (err.code === 'ER_ROW_IS_REFERENCED_2') {
         return res.status(400).json({ error: 'No se puede eliminar: La ubicación tiene items o usuarios asignados.' });
    }
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

module.exports = router;