const bcrypt = require("bcrypt");

// Función para cifrar una contraseña
const encrypt = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

// Función para comparar una contraseña con su versión cifrada
const compare = async (password, hashedPassword) => {
  const match = await bcrypt.compare(password, hashedPassword);
  return match;
};

module.exports = { encrypt, compare };
