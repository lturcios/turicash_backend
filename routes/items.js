// Ruta sugerida: backend/routes/items.js
const express = require('express');
const router = express.Router();
const dbPool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// --- Proteger todas las rutas de /items con el middleware ---
router.use(authMiddleware);

// --- GET /api/items ---
// Devuelve los items. Si el que pide es un admin (desde el panel web),
// podría devolver todo. Si es la app (móvil), filtra por ubicación.
router.get('/', async (req, res) => {
  // Por ahora, el panel web necesitará ver items de *todas* las ubicaciones
  // Asumiremos que el panel web necesita todo.
  // La app móvil filtra automáticamente por el locationId en su token.
  // Vamos a devolver todo para el panel.
  
  // (Mejora: Si el token del panel web no tiene locationId, es un admin)
  // Por simplicidad, devolvemos todo.
  
  const query = 'SELECT i.*, l.name as location_name FROM items i LEFT JOIN locations l ON i.location_id = l.id ORDER BY i.name ASC';

  try {
    const [results] = await dbPool.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener items:', err);
    return res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// --- GET /api/items/active (Solo items activos) ---
router.get('/active', async (req, res) => {
  // Este endpoint es para la app móvil, que solo necesita items activos.
  // Filtramos por location_id del token (middleware ya lo agregó a req.user).
  const locationId = req.user.locationId;
  const query = 'SELECT i.*, l.name as location_name FROM items i LEFT JOIN locations l ON i.location_id = l.id WHERE i.is_active = 1 AND i.location_id = ? ORDER BY i.name ASC';

  try {
    const [results] = await dbPool.query(query, [locationId]);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener items activos:', err);
    return res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// --- POST /api/items (Crear nuevo item) ---
router.post('/', async (req, res) => {
  const { name, price, location_id, icon_base64 } = req.body;

  if (!name || !price || !location_id) {
    return res.status(400).json({ error: 'Nombre, precio y ubicación son requeridos.' });
  }

  const query = `
    INSERT INTO items (name, price, location_id, icon_base64, is_active)
    VALUES (?, ?, ?, ?, true)
  `;
  
  try {
    const [result] = await dbPool.execute(query, [name, price, location_id, icon_base64 || null]);
    res.status(201).json({ message: 'Item creado', id: result.insertId });
  } catch (err) {
    console.error('Error al crear item:', err);
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- PUT /api/items/:id (Actualizar item) ---
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, location_id, icon_base64, is_active } = req.body;

  if (!name || !price || !location_id) {
    return res.status(400).json({ error: 'Nombre, precio y ubicación son requeridos.' });
  }

  // Si no se envía un nuevo ícono (icon_base64 es null o undefined), 
  // no lo actualizamos en la BD (lo mantenemos).
  
  let query;
  let params;
  
  if (icon_base64) {
    // Actualizar con nuevo ícono
    query = `
      UPDATE items 
      SET name = ?, price = ?, location_id = ?, icon_base64 = ?, is_active = ?
      WHERE id = ?
    `;
    params = [name, price, location_id, icon_base64, is_active, id];
  } else {
    // Actualizar SIN cambiar el ícono
    query = `
      UPDATE items 
      SET name = ?, price = ?, location_id = ?, is_active = ?
      WHERE id = ?
    `;
    params = [name, price, location_id, is_active, id];
  }

  try {
    const [result] = await dbPool.execute(query, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item no encontrado.' });
    }
    res.json({ message: 'Item actualizado' });
  } catch (err) {
    console.error('Error al actualizar item:', err);
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

// --- DELETE /api/items/:id (Desactivar/Eliminar item) ---
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Opcional: Podríamos solo desactivarlo (is_active = false)
  // Por ahora, lo borramos.
  const query = 'DELETE FROM items WHERE id = ?';

  try {
    const [result] = await dbPool.execute(query, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item no encontrado.' });
    }
    res.json({ message: 'Item eliminado' });
  } catch (err) {
    console.error('Error al eliminar item:', err);
    // Manejar error si el item está en uso (foreign key)
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
         return res.status(400).json({ error: 'No se puede eliminar: El item ya está en tickets emitidos.' });
    }
    res.status(500).json({ error: 'Error en la base de datos', details: err.message });
  }
});

module.exports = router;