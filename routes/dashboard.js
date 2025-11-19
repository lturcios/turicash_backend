// Ruta sugerida: backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dbPool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Proteger todas las rutas del dashboard
router.use(authMiddleware);

/**
 * --- GET /api/dashboard/stats ---
 * Estadísticas generales del sistema
 */
router.get('/stats', async (req, res) => {
  try {
    // Total de tickets
    const [ticketCount] = await dbPool.query('SELECT COUNT(*) as total FROM tickets');
    
    // Total de ventas (suma de todos los tickets)
    const [totalSales] = await dbPool.query('SELECT SUM(total_amount) as total FROM tickets');
    
    // Total de usuarios activos
    const [userCount] = await dbPool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
    
    // Total de items activos
    const [itemCount] = await dbPool.query('SELECT COUNT(*) as total FROM items WHERE is_active = true');
    
    // Total de ubicaciones activas
    const [locationCount] = await dbPool.query('SELECT COUNT(*) as total FROM locations WHERE is_active = true');
    
    // Promedio de ticket
    const [avgTicket] = await dbPool.query('SELECT AVG(total_amount) as average FROM tickets');

    res.json({
      totalTickets: ticketCount[0].total,
      totalSales: totalSales[0].total || 0,
      totalUsers: userCount[0].total,
      totalItems: itemCount[0].total,
      totalLocations: locationCount[0].total,
      averageTicket: avgTicket[0].average || 0
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/sales-by-period ---
 * Ventas agrupadas por período (día, semana, mes)
 * Query params: 
 *   - period: 'day' | 'week' | 'month' (default: 'day')
 *   - limit: número de períodos a mostrar (default: 30)
 *   - location_id: filtrar por ubicación (opcional)
 */
router.get('/sales-by-period', async (req, res) => {
  const { period = 'day', limit = 30, location_id } = req.query;
  
  let groupByClause;
  let dateFormat;
  
  switch (period) {
    case 'week':
      groupByClause = 'YEARWEEK(created_at_local, 1)';
      dateFormat = 'CONCAT(YEAR(created_at_local), "-W", LPAD(WEEK(created_at_local, 1), 2, "0"))';
      break;
    case 'month':
      groupByClause = 'DATE_FORMAT(created_at_local, "%Y-%m")';
      dateFormat = 'DATE_FORMAT(created_at_local, "%Y-%m")';
      break;
    case 'day':
    default:
      groupByClause = 'DATE(created_at_local)';
      dateFormat = 'DATE(created_at_local)';
      break;
  }

  let query = `
    SELECT 
      ${dateFormat} as period,
      COUNT(*) as ticket_count,
      SUM(total_amount) as total_sales,
      AVG(total_amount) as avg_ticket
    FROM tickets
    WHERE 1=1
  `;

  const params = [];
  
  if (location_id) {
    query += ' AND location_id = ?';
    params.push(location_id);
  }

  query += `
    GROUP BY ${groupByClause}
    ORDER BY period DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));

  try {
    const [results] = await dbPool.query(query, params);
    res.json(results.reverse()); // Invertir para mostrar desde el más antiguo al más reciente
  } catch (err) {
    console.error('Error al obtener ventas por período:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/top-items ---
 * Items más vendidos
 * Query params:
 *   - limit: número de items a mostrar (default: 10)
 *   - location_id: filtrar por ubicación (opcional)
 *   - date_from: fecha desde (opcional)
 *   - date_to: fecha hasta (opcional)
 */
router.get('/top-items', async (req, res) => {
  const { limit = 10, location_id, date_from, date_to } = req.query;

  let query = `
    SELECT 
      ti.item_id,
      ti.item_name,
      SUM(ti.quantity) as total_quantity,
      COUNT(DISTINCT ti.ticket_id) as times_ordered,
      SUM(ti.quantity * ti.unit_price) as total_revenue,
      AVG(ti.unit_price) as avg_price
    FROM ticket_items ti
    INNER JOIN tickets t ON ti.ticket_id = t.id
    WHERE 1=1
  `;

  const params = [];

  if (location_id) {
    query += ' AND t.location_id = ?';
    params.push(location_id);
  }

  if (date_from) {
    query += ' AND t.created_at_local >= ?';
    params.push(new Date(date_from));
  }

  if (date_to) {
    const endDate = new Date(date_to);
    endDate.setHours(23, 59, 59, 999);
    query += ' AND t.created_at_local <= ?';
    params.push(endDate);
  }

  query += `
    GROUP BY ti.item_id, ti.item_name
    ORDER BY total_quantity DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));

  try {
    const [results] = await dbPool.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener top items:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/sales-by-location ---
 * Ventas agrupadas por ubicación
 * Query params:
 *   - date_from: fecha desde (opcional)
 *   - date_to: fecha hasta (opcional)
 */
router.get('/sales-by-location', async (req, res) => {
  const { date_from, date_to } = req.query;

  let query = `
    SELECT 
      l.id,
      l.name as location_name,
      COUNT(t.id) as ticket_count,
      SUM(t.total_amount) as total_sales,
      AVG(t.total_amount) as avg_ticket
    FROM locations l
    LEFT JOIN tickets t ON l.id = t.location_id
    WHERE l.is_active = true
  `;

  const params = [];

  if (date_from) {
    query += ' AND t.created_at_local >= ?';
    params.push(new Date(date_from));
  }

  if (date_to) {
    const endDate = new Date(date_to);
    endDate.setHours(23, 59, 59, 999);
    query += ' AND t.created_at_local <= ?';
    params.push(endDate);
  }

  query += `
    GROUP BY l.id, l.name
    ORDER BY total_sales DESC
  `;

  try {
    const [results] = await dbPool.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener ventas por ubicación:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/sales-by-user ---
 * Ventas agrupadas por usuario
 * Query params:
 *   - limit: número de usuarios a mostrar (default: 10)
 *   - location_id: filtrar por ubicación (opcional)
 *   - date_from: fecha desde (opcional)
 *   - date_to: fecha hasta (opcional)
 */
router.get('/sales-by-user', async (req, res) => {
  const { limit = 10, location_id, date_from, date_to } = req.query;

  let query = `
    SELECT 
      u.id,
      u.username,
      u.full_name,
      l.name as location_name,
      COUNT(t.id) as ticket_count,
      SUM(t.total_amount) as total_sales,
      AVG(t.total_amount) as avg_ticket
    FROM users u
    LEFT JOIN tickets t ON u.id = t.user_id
    LEFT JOIN locations l ON u.location_id = l.id
    WHERE u.is_active = true
  `;

  const params = [];

  if (location_id) {
    query += ' AND u.location_id = ?';
    params.push(location_id);
  }

  if (date_from) {
    query += ' AND t.created_at_local >= ?';
    params.push(new Date(date_from));
  }

  if (date_to) {
    const endDate = new Date(date_to);
    endDate.setHours(23, 59, 59, 999);
    query += ' AND t.created_at_local <= ?';
    params.push(endDate);
  }

  query += `
    GROUP BY u.id, u.username, u.full_name, l.name
    ORDER BY total_sales DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));

  try {
    const [results] = await dbPool.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener ventas por usuario:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/payment-methods ---
 * Distribución de métodos de pago
 * Query params:
 *   - location_id: filtrar por ubicación (opcional)
 *   - date_from: fecha desde (opcional)
 *   - date_to: fecha hasta (opcional)
 */
router.get('/payment-methods', async (req, res) => {
  const { location_id, date_from, date_to } = req.query;

  let query = `
    SELECT 
      payment_type,
      COUNT(*) as ticket_count,
      SUM(total_amount) as total_sales,
      AVG(total_amount) as avg_ticket
    FROM tickets
    WHERE 1=1
  `;

  const params = [];

  if (location_id) {
    query += ' AND location_id = ?';
    params.push(location_id);
  }

  if (date_from) {
    query += ' AND created_at_local >= ?';
    params.push(new Date(date_from));
  }

  if (date_to) {
    const endDate = new Date(date_to);
    endDate.setHours(23, 59, 59, 999);
    query += ' AND created_at_local <= ?';
    params.push(endDate);
  }

  query += `
    GROUP BY payment_type
    ORDER BY total_sales DESC
  `;

  try {
    const [results] = await dbPool.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener métodos de pago:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/recent-activity ---
 * Actividad reciente (últimos tickets)
 * Query params:
 *   - limit: número de tickets a mostrar (default: 10)
 *   - location_id: filtrar por ubicación (opcional)
 */
router.get('/recent-activity', async (req, res) => {
  const { limit = 10, location_id } = req.query;

  let query = `
    SELECT 
      t.id,
      t.correlative_number,
      t.total_amount,
      t.payment_type,
      t.created_at_local,
      u.username,
      u.full_name,
      l.name as location_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN locations l ON t.location_id = l.id
    WHERE 1=1
  `;

  const params = [];

  if (location_id) {
    query += ' AND t.location_id = ?';
    params.push(location_id);
  }

  query += `
    ORDER BY t.created_at_local DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));

  try {
    const [results] = await dbPool.query(query, params);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener actividad reciente:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/sales-today ---
 * Resumen de ventas del día actual
 * Query params:
 *   - location_id: filtrar por ubicación (opcional)
 */
router.get('/sales-today', async (req, res) => {
  const { location_id } = req.query;

  let query = `
    SELECT 
      COUNT(*) as ticket_count,
      SUM(total_amount) as total_sales,
      AVG(total_amount) as avg_ticket,
      MIN(total_amount) as min_ticket,
      MAX(total_amount) as max_ticket
    FROM tickets
    WHERE DATE(created_at_local) = CURDATE()
  `;

  const params = [];

  if (location_id) {
    query += ' AND location_id = ?';
    params.push(location_id);
  }

  try {
    const [results] = await dbPool.query(query, params);
    res.json(results[0]);
  } catch (err) {
    console.error('Error al obtener ventas de hoy:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

/**
 * --- GET /api/dashboard/hourly-sales ---
 * Ventas por hora del día (útil para gráficos de barras por hora)
 * Query params:
 *   - date: fecha específica (default: hoy)
 *   - location_id: filtrar por ubicación (opcional)
 */
router.get('/hourly-sales', async (req, res) => {
  const { date, location_id } = req.query;

  let query = `
    SELECT 
      HOUR(created_at_local) as hour,
      COUNT(*) as ticket_count,
      SUM(total_amount) as total_sales
    FROM tickets
    WHERE DATE(created_at_local) = ?
  `;

  const params = [];
  const targetDate = date ? new Date(date) : new Date();
  params.push(targetDate.toISOString().split('T')[0]); // YYYY-MM-DD

  if (location_id) {
    query += ' AND location_id = ?';
    params.push(location_id);
  }

  query += `
    GROUP BY HOUR(created_at_local)
    ORDER BY hour ASC
  `;

  try {
    const [results] = await dbPool.query(query, params);
    
    // Rellenar horas sin ventas con 0
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      ticket_count: 0,
      total_sales: 0
    }));

    results.forEach(row => {
      hourlyData[row.hour] = row;
    });

    res.json(hourlyData);
  } catch (err) {
    console.error('Error al obtener ventas por hora:', err);
    res.status(500).json({ error: 'Error en la base de datos' });
  }
});

module.exports = router;
