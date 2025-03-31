const express = require("express");
const { validatorRegister, validatorLogin, validatorValidateEmail, validatorCompanyPatch } = require("../validators/auth");

const {uploadMiddlewareMemory} = require("../utils/handleStorage");
const authMiddleware = require("../middleware/session")

const router = express.Router();
const { 
    registerCtrl,
    loginCtrl,
    verifyEmailCtrl,
    updateUserCtrl,
    getUserFromTokenCtrl,
    deleteUserCtrl,
    forgotPasswordCtrl,
    resetPasswordCtrl,  
    uploadLogo
} = require("../controllers/user");

// Middleware para la verificación de JWT
const { verifyToken } = require("../utils/handleJwt");

// ** Rutas de registro y verificación de email **

// Ruta para el registro de usuario
router.post(
    "/register", 
    validatorRegister,  // Aplicando el validador
    registerCtrl
);

// Ruta para verificar el email
router.post(
    "/verify-email", 
    validatorValidateEmail,  // Aplicando el validador
    verifyEmailCtrl
);

// Ruta para el login
router.post(
    "/login", 
    validatorLogin,  // Aplicando el validador
    loginCtrl
);

// Ruta para el olvido de la contraseña
router.post(
    "/forgot-password", 
    // Aplicando el validador
    forgotPasswordCtrl
);

// Ruta para el restablecimiento de la contraseña
router.post(
    "/reset-password", 
    resetPasswordCtrl
);

// Ruta para el onboarding
router.put(
    "/onboarding",
    authMiddleware, 
    updateUserCtrl
);

// Ruta para la eliminación de usuario
router.delete(
    "/delete", 
    authMiddleware,
    deleteUserCtrl
);

// Ruta para obtener los datos del usuario a partir del token JWT
router.get(
    "/me",
    authMiddleware, 
    getUserFromTokenCtrl  // Controlador para obtener el usuario
);

router.patch(
    "/logo",
    authMiddleware,
    uploadMiddlewareMemory.single("image"),
    uploadLogo
);

module.exports = router;
