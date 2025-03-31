const jwt = require("jsonwebtoken");
const { handleHttpError } = require("../utils/handleHttpError");

// Middleware para verificar si el usuario tiene un token JWT válido
const requireAuth = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return handleHttpError(res, "TOKEN_MISSING", 401); // Error si no hay token
  }

  // Verificar el token
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return handleHttpError(res, "INVALID_TOKEN", 401); // Error si el token no es válido
    }

    // Si el token es válido, agregamos el usuario decodificado al objeto `req`
    req.user = decoded; 
    next(); // Continuamos con la siguiente función de middleware o controlador
  });
};

module.exports = requireAuth;
