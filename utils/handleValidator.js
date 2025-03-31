const { validationResult } = require("express-validator");

// Función para manejar errores de validación
const handleValidator = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next(); // Si no hay errores, continúa al siguiente middleware o controlador
};

module.exports = { handleValidator };
