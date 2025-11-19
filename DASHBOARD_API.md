# Dashboard API - Documentación de Endpoints

Este documento describe todos los endpoints disponibles para el dashboard del sistema TuriCash.

**Nota:** Todos los endpoints requieren autenticación mediante token JWT en el header:
```
Authorization: Bearer <tu_token_jwt>
```

---

## 📊 Estadísticas Generales

### GET `/api/dashboard/stats`
Obtiene estadísticas generales del sistema.

**Respuesta de ejemplo:**
```json
{
  "totalTickets": 1523,
  "totalSales": 45678.50,
  "totalUsers": 25,
  "totalItems": 48,
  "totalLocations": 5,
  "averageTicket": 29.99
}
```

---

## 📈 Ventas por Período

### GET `/api/dashboard/sales-by-period`
Ventas agrupadas por día, semana o mes.

**Query Parameters:**
- `period`: `'day'` | `'week'` | `'month'` (default: `'day'`)
- `limit`: Número de períodos (default: `30`)
- `location_id`: ID de ubicación (opcional)

**Ejemplos de uso:**

**Ventas diarias (últimos 30 días):**
```
GET /api/dashboard/sales-by-period?period=day&limit=30
```

**Ventas semanales (últimas 12 semanas):**
```
GET /api/dashboard/sales-by-period?period=week&limit=12
```

**Ventas mensuales (últimos 6 meses) de una ubicación específica:**
```
GET /api/dashboard/sales-by-period?period=month&limit=6&location_id=2
```

**Respuesta de ejemplo:**
```json
[
  {
    "period": "2024-01-15",
    "ticket_count": 45,
    "total_sales": 1234.50,
    "avg_ticket": 27.43
  },
  {
    "period": "2024-01-16",
    "ticket_count": 52,
    "total_sales": 1567.20,
    "avg_ticket": 30.14
  }
]
```

**Uso en gráficos (Chart.js):**
```javascript
const response = await fetch('/api/dashboard/sales-by-period?period=day&limit=7', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

const chartData = {
  labels: data.map(d => d.period),
  datasets: [{
    label: 'Ventas Totales',
    data: data.map(d => d.total_sales),
    backgroundColor: 'rgba(75, 192, 192, 0.2)',
    borderColor: 'rgba(75, 192, 192, 1)',
    borderWidth: 1
  }]
};
```

---

## 🏆 Top Items Más Vendidos

### GET `/api/dashboard/top-items`
Lista de productos más vendidos.

**Query Parameters:**
- `limit`: Número de items (default: `10`)
- `location_id`: Filtrar por ubicación (opcional)
- `date_from`: Fecha desde `YYYY-MM-DD` (opcional)
- `date_to`: Fecha hasta `YYYY-MM-DD` (opcional)

**Ejemplos de uso:**

**Top 10 items más vendidos:**
```
GET /api/dashboard/top-items?limit=10
```

**Top 5 items del último mes:**
```
GET /api/dashboard/top-items?limit=5&date_from=2024-01-01&date_to=2024-01-31
```

**Respuesta de ejemplo:**
```json
[
  {
    "item_id": 15,
    "item_name": "Café Americano",
    "total_quantity": 345,
    "times_ordered": 215,
    "total_revenue": 1725.00,
    "avg_price": 5.00
  },
  {
    "item_id": 8,
    "item_name": "Croissant",
    "total_quantity": 289,
    "times_ordered": 178,
    "total_revenue": 867.00,
    "avg_price": 3.00
  }
]
```

---

## 📍 Ventas por Ubicación

### GET `/api/dashboard/sales-by-location`
Ventas agrupadas por ubicación.

**Query Parameters:**
- `date_from`: Fecha desde `YYYY-MM-DD` (opcional)
- `date_to`: Fecha hasta `YYYY-MM-DD` (opcional)

**Ejemplo de uso:**
```
GET /api/dashboard/sales-by-location?date_from=2024-01-01&date_to=2024-01-31
```

**Respuesta de ejemplo:**
```json
[
  {
    "id": 1,
    "location_name": "Sucursal Centro",
    "ticket_count": 456,
    "total_sales": 13456.78,
    "avg_ticket": 29.50
  },
  {
    "id": 2,
    "location_name": "Sucursal Norte",
    "ticket_count": 389,
    "total_sales": 11234.50,
    "avg_ticket": 28.88
  }
]
```

**Uso en gráfico de pastel:**
```javascript
const response = await fetch('/api/dashboard/sales-by-location', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

const pieData = {
  labels: data.map(d => d.location_name),
  datasets: [{
    data: data.map(d => d.total_sales),
    backgroundColor: [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)'
    ]
  }]
};
```

---

## 👥 Ventas por Usuario

### GET `/api/dashboard/sales-by-user`
Ventas agrupadas por usuario (performance de empleados).

**Query Parameters:**
- `limit`: Número de usuarios (default: `10`)
- `location_id`: Filtrar por ubicación (opcional)
- `date_from`: Fecha desde (opcional)
- `date_to`: Fecha hasta (opcional)

**Ejemplo de uso:**
```
GET /api/dashboard/sales-by-user?limit=5&location_id=1
```

**Respuesta de ejemplo:**
```json
[
  {
    "id": 7,
    "username": "juan123",
    "full_name": "Juan Pérez",
    "location_name": "Sucursal Centro",
    "ticket_count": 89,
    "total_sales": 2345.67,
    "avg_ticket": 26.36
  },
  {
    "id": 12,
    "username": "maria456",
    "full_name": "María González",
    "location_name": "Sucursal Centro",
    "ticket_count": 76,
    "total_sales": 2103.45,
    "avg_ticket": 27.68
  }
]
```

---

## ⏱️ Actividad Reciente

### GET `/api/dashboard/recent-activity`
Últimos tickets emitidos (actividad en tiempo real).

**Query Parameters:**
- `limit`: Número de tickets (default: `10`)
- `location_id`: Filtrar por ubicación (opcional)

**Ejemplo de uso:**
```
GET /api/dashboard/recent-activity?limit=20
```

**Respuesta de ejemplo:**
```json
[
  {
    "id": 1523,
    "correlative_number": "T-001523",
    "total_amount": 45.50,
    "payment_type": "EFECTIVO",
    "created_at_local": "2024-01-20T15:45:30.000Z",
    "username": "juan123",
    "full_name": "Juan Pérez",
    "location_name": "Sucursal Centro"
  },
  {
    "id": 1522,
    "correlative_number": "T-001522",
    "total_amount": 32.00,
    "payment_type": "TARJETA",
    "created_at_local": "2024-01-20T15:42:15.000Z",
    "username": "maria456",
    "full_name": "María González",
    "location_name": "Sucursal Norte"
  }
]
```

---

## 📅 Ventas de Hoy

### GET `/api/dashboard/sales-today`
Resumen de ventas del día actual.

**Query Parameters:**
- `location_id`: Filtrar por ubicación (opcional)

**Ejemplo de uso:**
```
GET /api/dashboard/sales-today
```

**Respuesta de ejemplo:**
```json
{
  "ticket_count": 45,
  "total_sales": 1234.50,
  "avg_ticket": 27.43,
  "min_ticket": 5.00,
  "max_ticket": 125.50
}
```

---

## 🕐 Ventas por Hora

### GET `/api/dashboard/hourly-sales`
Ventas agrupadas por hora del día (útil para ver picos de actividad).

**Query Parameters:**
- `date`: Fecha específica `YYYY-MM-DD` (default: hoy)
- `location_id`: Filtrar por ubicación (opcional)

**Ejemplo de uso:**
```
GET /api/dashboard/hourly-sales?date=2024-01-20
```

**Respuesta de ejemplo:**
```json
[
  { "hour": 0, "ticket_count": 0, "total_sales": 0 },
  { "hour": 1, "ticket_count": 0, "total_sales": 0 },
  { "hour": 8, "ticket_count": 5, "total_sales": 123.50 },
  { "hour": 9, "ticket_count": 12, "total_sales": 345.20 },
  { "hour": 10, "ticket_count": 18, "total_sales": 567.80 },
  ...
  { "hour": 23, "ticket_count": 2, "total_sales": 45.00 }
]
```

**Uso en gráfico de barras:**
```javascript
const response = await fetch('/api/dashboard/hourly-sales', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

const chartData = {
  labels: data.map(d => `${d.hour}:00`),
  datasets: [{
    label: 'Tickets por hora',
    data: data.map(d => d.ticket_count),
    backgroundColor: 'rgba(54, 162, 235, 0.6)'
  }]
};
```

---


## 📝 Notas

1. **Performance**: Los endpoints tienen límites de resultados para evitar sobrecarga
2. **Fechas**: Formato recomendado `YYYY-MM-DD` para compatibilidad
3. **Zona horaria**: Las fechas se almacenan como `created_at_local` (hora local del dispositivo)
4. **Cache**: Considera implementar cache en frontend para reducir llamadas repetitivas
