const express = require('express');
const router = express.Router();
const dbPool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Proteger todas las rutas con authMiddleware
router.use(authMiddleware);

// --- GET /api/categories/location/:locationId ---
// Obtiene todas las categorías activas de una ubicación específica
router.get('/location/:locationId', async (req, res) => {
  const { locationId } = req.params;
  const query = 'SELECT * FROM categories WHERE location_id = ? AND is_active = 1 ORDER BY name ASC';

  try {
    const [results] = await dbPool.query(query, [locationId]);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// --- GET /api/categories/:id ---
// Detalle de una categoría
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM categories WHERE id = ?';

  try {
    const [results] = await dbPool.query(query, [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener categoría:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// --- POST /api/categories ---
// Crear nueva categoría
router.post('/', async (req, res) => {
  const { location_id, name, color_hex, icon_base64 } = req.body;

  if (!location_id || !name) {
    return res.status(400).json({ error: 'Ubicación y nombre son requeridos.' });
  }

  const query = `
    INSERT INTO categories (location_id, name, color_hex, icon_base64, is_active)
    VALUES (?, ?, ?, ?, true)
  `;

  try {
    const [result] = await dbPool.execute(query, [location_id, name, color_hex || '#3498db', icon_base64 || null]);
    res.status(201).json({ message: 'Categoría creada', id: result.insertId });
  } catch (err) {
    console.error('Error al crear categoría:', err);
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- PUT /api/categories/:id ---
// Actualizar categoría
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, color_hex, icon_base64, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'El nombre es requerido.' });
  }

  const query = `
    UPDATE categories 
    SET name = ?, color_hex = ?, icon_base64 = ?, is_active = ?
    WHERE id = ?
  `;

  try {
    const [result] = await dbPool.execute(query, [name, color_hex, icon_base64, is_active, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json({ message: 'Categoría actualizada' });
  } catch (err) {
    console.error('Error al actualizar categoría:', err);
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- DELETE /api/categories/:id ---
// Baja lógica de la categoría
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Verificamos si tiene ítems asociados antes de borrar/desactivar
  const checkQuery = 'SELECT COUNT(*) as count FROM items WHERE category_id = ? AND is_active = 1';
  const deleteQuery = 'UPDATE categories SET is_active = 0 WHERE id = ?';

  try {
    const [checkResults] = await dbPool.query(checkQuery, [id]);
    if (checkResults[0].count > 0) {
      return res.status(400).json({ error: 'No se puede desactivar: Hay ítems activos asociados a esta categoría.' });
    }

    const [result] = await dbPool.execute(deleteQuery, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json({ message: 'Categoría desactivada correctamente.' });
  } catch (err) {
    console.error('Error al desactivar categoría:', err);
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

module.exports = router;