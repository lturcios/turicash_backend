// Ruta sugerida: backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_super_seguro';

module.exports = function (req, res, next) {
  // Obtener token de la cabecera 'Authorization'
  const authHeader = req.header('Authorization');
  
  // Verificar si hay cabecera
  if (!authHeader) {
    return res.status(401).json({ error: 'No hay token, autorización denegada' });
  }

  // Verificar si el formato es 'Bearer [token]'
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
     return res.status(401).json({ error: 'Formato de token inválido' });
  }

  const token = tokenParts[1];

  // Verificar el token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Añadir el payload del token (que incluye userId, locationId)
    // al objeto 'request' para que las rutas lo puedan usar
    req.user = decoded; 
    
    next(); // Pasar al siguiente middleware o ruta
  } catch (e) {
    res.status(401).json({ error: 'Token no es válido' });
  }
};

