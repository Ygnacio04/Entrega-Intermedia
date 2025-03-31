const jwt = require("jsonwebtoken");

// Firmar un nuevo JWT con el payload del usuario
const tokenSign = async (user) => {
  const payload = {
    _id: user._id,
    role: user.role,
    email: user.email,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "24h" });
  return token;
};

// Verificar un JWT
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    return decoded;
  } catch (error) {
    throw new Error("Token inválido o expirado.");
  }
};

module.exports = { tokenSign, verifyToken };
