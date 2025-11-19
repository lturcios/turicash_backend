# 📋 Resumen de Endpoints - TuriCash API

## 🔐 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Auth Requerido |
|--------|----------|-------------|----------------|
| POST | `/api/auth/login` | Login de usuario | ❌ |
| POST | `/api/auth/register` | Registrar nuevo usuario | ❌ |

---

## 📍 Ubicaciones (`/api/locations`)

| Método | Endpoint | Descripción | Auth Requerido |
|--------|----------|-------------|----------------|
| GET | `/api/locations` | Obtener todas las ubicaciones | ✅ |
| POST | `/api/locations` | Crear nueva ubicación | ✅ |
| PUT | `/api/locations/:id` | Actualizar ubicación | ✅ |
| DELETE | `/api/locations/:id` | Eliminar ubicación | ✅ |

---

## 🛍️ Items/Productos (`/api/items`)

| Método | Endpoint | Descripción | Auth Requerido |
|--------|----------|-------------|----------------|
| GET | `/api/items` | Obtener todos los items | ✅ |
| POST | `/api/items` | Crear nuevo item | ✅ |
| PUT | `/api/items/:id` | Actualizar item | ✅ |
| DELETE | `/api/items/:id` | Eliminar item | ✅ |

---

## 👥 Usuarios (`/api/users`)

| Método | Endpoint | Descripción | Auth Requerido |
|--------|----------|-------------|----------------|
| GET | `/api/users` | Obtener todos los usuarios | ✅ |
| POST | `/api/users` | Crear nuevo usuario | ✅ |
| PUT | `/api/users/:id` | Actualizar usuario | ✅ |
| DELETE | `/api/users/:id` | Eliminar usuario | ✅ |

---

## 🎫 Tickets (`/api/tickets`)

| Método | Endpoint | Descripción | Auth Requerido |
|--------|----------|-------------|----------------|
| GET | `/api/tickets` | Obtener historial de tickets (con filtros) | ✅ |
| POST | `/api/tickets/sync` | Sincronizar tickets desde app móvil | ✅ |
| GET | `/api/tickets/:id/items` | Obtener items de un ticket específico | ✅ |

**Filtros disponibles en GET `/api/tickets`:**
- `date_from` - Fecha desde (YYYY-MM-DD)
- `date_to` - Fecha hasta (YYYY-MM-DD)
- `user_id` - Filtrar por usuario
- `location_id` - Filtrar por ubicación

---

## 📊 Dashboard (`/api/dashboard`) ⭐ NUEVO

| Método | Endpoint | Descripción | Parámetros |
|--------|----------|-------------|------------|
| GET | `/api/dashboard/stats` | Estadísticas generales | - |
| GET | `/api/dashboard/sales-by-period` | Ventas por período | `period`, `limit`, `location_id` |
| GET | `/api/dashboard/top-items` | Items más vendidos | `limit`, `location_id`, `date_from`, `date_to` |
| GET | `/api/dashboard/sales-by-location` | Ventas por ubicación | `date_from`, `date_to` |
| GET | `/api/dashboard/sales-by-user` | Ventas por usuario | `limit`, `location_id`, `date_from`, `date_to` |
| GET | `/api/dashboard/payment-methods` | Distribución métodos de pago | `location_id`, `date_from`, `date_to` |
| GET | `/api/dashboard/recent-activity` | Actividad reciente | `limit`, `location_id` |
| GET | `/api/dashboard/sales-today` | Ventas del día actual | `location_id` |
| GET | `/api/dashboard/hourly-sales` | Ventas por hora | `date`, `location_id` |

---

## 🎯 Casos de Uso para Dashboard

### 1️⃣ Dashboard Principal (Vista General)
```
GET /api/dashboard/stats
GET /api/dashboard/sales-today
GET /api/dashboard/recent-activity?limit=5
GET /api/dashboard/sales-by-period?period=day&limit=7
```

### 2️⃣ Reporte de Ventas (Vista Detallada)
```
GET /api/dashboard/sales-by-location?date_from=2024-01-01&date_to=2024-01-31
GET /api/dashboard/sales-by-user?limit=10&date_from=2024-01-01
GET /api/dashboard/top-items?limit=10&date_from=2024-01-01
```

### 3️⃣ Análisis de Productos
```
GET /api/dashboard/top-items?limit=20
GET /api/items
```

### 4️⃣ Performance de Empleados
```
GET /api/dashboard/sales-by-user?limit=20
GET /api/users
```

### 5️⃣ Análisis por Ubicación
```
GET /api/dashboard/sales-by-location
GET /api/dashboard/sales-by-period?location_id=1&period=month&limit=12
GET /api/dashboard/top-items?location_id=1&limit=10
```

### 6️⃣ Análisis de Horarios
```
GET /api/dashboard/hourly-sales?date=2024-01-20
GET /api/dashboard/hourly-sales (hoy por defecto)
```

---

## 🔑 Autenticación

Todos los endpoints (excepto `/api/auth/login` y `/api/auth/register`) requieren un token JWT:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Obtener token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"tu_usuario","pin":"tu_pin"}'
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "tu_usuario",
    "full_name": "Tu Nombre",
    "location_id": 1,
    "location_name": "Sucursal Centro"
  }
}
```

---

## 📱 Ejemplo de Uso en Frontend

### React/Next.js
```jsx
// Hook personalizado para el dashboard
import { useState, useEffect } from 'react';

export function useDashboard(token) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
      setLoading(false);
    }
    fetchData();
  }, [token]);

  return { stats, loading };
}

// Componente
export default function Dashboard() {
  const token = localStorage.getItem('token');
  const { stats, loading } = useDashboard(token);

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Total Ventas: ${stats.totalSales}</h1>
      <h2>Total Tickets: {stats.totalTickets}</h2>
    </div>
  );
}
```

### JavaScript Vanilla
```javascript
async function loadDashboard() {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:5000/api/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const stats = await response.json();
  
  document.getElementById('totalSales').textContent = `$${stats.totalSales}`;
  document.getElementById('totalTickets').textContent = stats.totalTickets;
}
```

---

## 🧪 Testing con Postman

### Colección de Postman
1. **Crear variable de entorno:**
   - `base_url`: `http://localhost:5000`
   - `token`: (se guardará después del login)

2. **Test de Login:**
   ```
   POST {{base_url}}/api/auth/login
   Body: { "username": "test", "pin": "1234" }
   ```
   
3. **Guardar token automáticamente (Tests tab):**
   ```javascript
   pm.environment.set("token", pm.response.json().token);
   ```

4. **Usar token en otros requests:**
   ```
   Authorization: Bearer {{token}}
   ```

---

## 📈 Métricas y KPIs Disponibles

### Ventas
- ✅ Total de ventas (monto)
- ✅ Número de tickets
- ✅ Ticket promedio
- ✅ Ticket mínimo/máximo
- ✅ Ventas por período (día/semana/mes)
- ✅ Ventas por hora del día

### Productos
- ✅ Items más vendidos (cantidad)
- ✅ Items con mayor revenue
- ✅ Número de veces ordenado
- ✅ Precio promedio

### Ubicaciones
- ✅ Ventas por ubicación
- ✅ Tickets por ubicación
- ✅ Ticket promedio por ubicación

### Usuarios
- ✅ Performance de vendedores
- ✅ Tickets por usuario
- ✅ Ventas por usuario

### Métodos de Pago
- ✅ Distribución por tipo de pago
- ✅ Monto por tipo de pago
- ✅ Ticket promedio por tipo

---

## 🚀 URL Base por Entorno

| Entorno | URL |
|---------|-----|
| Development | `http://localhost:5000` |
| Production | `https://api.turicash.com` (ejemplo) |

---

## 📞 Soporte

Para más información, consulta:
- `DASHBOARD_API.md` - Documentación detallada del dashboard
- `README.md` - Documentación general del proyecto
