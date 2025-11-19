// Ruta sugerida: backend/routes/tickets.js
const express = require('express');
const router = express.Router();
const dbPool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Proteger todas las rutas de tickets
router.use(authMiddleware);

/**
 * --- POST /api/tickets/sync ---
 * Recibe un lote de tickets desde la app móvil (SyncTicketWorker)
 * y los inserta en la base de datos usando una transacción.
 */
router.post('/sync', async (req, res) => {
  const { tickets } = req.body; // Array de tickets desde el DTO

  if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
    return res.status(400).json({ error: 'No se recibieron tickets válidos.' });
  }

  let connection;
  try {
    // 1. Obtener una conexión del pool
    connection = await dbPool.getConnection();
    
    // 2. Iniciar la transacción
    await connection.beginTransaction();

    let ticketsProcesados = 0;

    // 3. Iterar sobre cada ticket enviado desde la app
    for (const ticketDto of tickets) {
      
      // 3.1. Insertar la cabecera (tickets)
      const ticketQuery = `
        INSERT INTO tickets 
        (local_ticket_uuid, user_id, location_id, correlative_number, total_amount, payment_type, created_at_local)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Convertir timestamp de JS (ms) a TIMESTAMP de SQL
      const localDate = new Date(ticketDto.createdAtLocal);

      const [ticketResult] = await connection.execute(ticketQuery, [
        ticketDto.localUuid,
        ticketDto.userId,       // TODO: En Iteración 5, nos faltó guardar el ID real del usuario en DataStore.
        ticketDto.locationId,   // El WorkManager deberá obtener esto.
        ticketDto.correlativeNumber,
        ticketDto.totalAmount,
        ticketDto.paymentType,
        localDate
      ]);

      const newTicketId = ticketResult.insertId;

      // 3.2. Insertar los items (ticket_items)
      if (ticketDto.items && ticketDto.items.length > 0) {
        const itemsQuery = `
          INSERT INTO ticket_items 
          (ticket_id, item_id, quantity, unit_price, item_name)
          VALUES ? 
        `; // Inserción múltiple

        const itemsData = ticketDto.items.map(item => [
          newTicketId,
          item.itemId,
          item.quantity,
          item.unitPrice,
          item.itemName
        ]);

        await connection.query(itemsQuery, [itemsData]);
      }
      ticketsProcesados++;
    }

    // 4. Si todo salió bien, confirmar la transacción
    await connection.commit();
    
    res.status(201).json({ 
      message: `Sincronización exitosa. ${ticketsProcesados} tickets guardados.` 
    });

  } catch (error) {
    // 5. Si algo falló, revertir la transacción
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en /tickets/sync:', error);
    res.status(500).json({ 
      error: 'Error en el servidor al guardar tickets.',
      details: error.message
    });

  } finally {
    // 6. Siempre liberar la conexión al pool
    if (connection) {
      connection.release();
    }
  }
});

// --- GET /api/tickets (Historial con filtros) ---
router.get('/', async (req, res) => {
  const { date_from, date_to, user_id, location_id } = req.query;

  // Construcción dinámica de la query
  let query = `
    SELECT t.*, u.username, l.name as location_name 
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN locations l ON t.location_id = l.id
    WHERE 1=1
  `;
  
  const params = [];

  if (date_from) {
    query += ' AND t.created_at_local >= ?';
    params.push(new Date(date_from));
  }

  if (date_to) {
    // Ajustar al final del día si es necesario, o asumir que el cliente envía timestamp completo
    // Aquí asumimos que el cliente envía YYYY-MM-DD y queremos incluir todo ese día
    const endDate = new Date(date_to);
    endDate.setHours(23, 59, 59, 999);
    query += ' AND t.created_at_local <= ?';
    params.push(endDate);
  }

  if (user_id) {
    query += ' AND t.user_id = ?';
    params.push(user_id);
  }

  if (location_id) {
    query += ' AND t.location_id = ?';
    params.push(location_id);
  }

  query += ' ORDER BY t.created_at_local DESC LIMIT 500'; // Límite de seguridad

  try {
    const [tickets] = await dbPool.query(query, params);
    
    // Opcional: Si quieres incluir los items de cada ticket,
    // tendrías que hacer otra query o un GROUP_CONCAT complejo.
    // Por rendimiento, a veces es mejor traer solo cabeceras y pedir detalles on-demand,
    // o hacer una segunda query para traer los items de estos tickets.
    
    res.json(tickets);
  } catch (err) {
    console.error('Error al obtener historial:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

// --- GET /api/tickets/:id/items (Detalle de un ticket) ---
router.get('/:id/items', async (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM ticket_items WHERE ticket_id = ?';
    try {
        const [items] = await dbPool.query(query, [id]);
        res.json(items);
    } catch (err) {
        console.error('Error al obtener detalles del ticket:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

module.exports = router;