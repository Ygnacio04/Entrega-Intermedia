const { matchedData } = require("express-validator");
const { tokenSign } = require("../utils/handleJwt");
const { encrypt, compare } = require("../utils/handlePassword");
const { handleHttpError } = require("../utils/handleHttpError");
const uploadToPinata = require("../utils/uploadToPinata");
const { usersModel } = require("../models");
const nodemailer = require('nodemailer');

// Generador de código de verificación
const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// **Registro de usuario**
const registerCtrl = async (req, res) => {
    try {
        req = matchedData(req);
        
        // Verificar si el usuario ya existe
        const existingUser = await usersModel.findOne({ email: req.email });
        if (existingUser && existingUser.status === 1) {
            return handleHttpError(res, "USER_ALREADY_EXISTS", 409);
        }

        // Cifrar la contraseña
        const hashedPassword = await encrypt(req.password);

        // Generar código de verificación
        const verificationCode = generateVerificationCode();
        const maxAttempts = 3;

        const body = { ...req, password: hashedPassword, verificationCode, verificationAttempts: maxAttempts };
        const dataUser = await usersModel.create(body);
        dataUser.set('password', undefined, { strict: false }); // Excluir la contraseña del resultado

        const data = {
            token: await tokenSign(dataUser),
            user: dataUser
        };

        res.send(data);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_REGISTER_USER");
    }
};

// **Validación de email**
const verifyEmailCtrl = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        const user = await usersModel.findOne({ email });

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).send({
                message: "Código de verificación incorrecto"
            });
        }

        user.status = 1; // El usuario es verificado
        await user.save();

        res.send({ message: "Correo electrónico verificado correctamente" });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_VERIFY_EMAIL");
    }
};

// **Login**
const loginCtrl = async (req, res) => {
    try {
        req = matchedData(req);
        const user = await usersModel.findOne({ email: req.email }).select("password name role email status");

        if (!user) {
            return handleHttpError(res, "USER_NOT_EXISTS", 404);
        }

        if (user.status !== 1) {
            return handleHttpError(res, "EMAIL_NOT_VERIFIED", 403);
        }

        const check = await compare(req.password, user.password);
        if (!check) {
            return handleHttpError(res, "INVALID_PASSWORD", 401);
        }

        user.set("password", undefined, { strict: false });

        const data = {
            token: await tokenSign(user),
            user
        };

        res.send(data);
    } catch (err) {
        console.error(err);
        handleHttpError(res, "ERROR_LOGIN_USER");
    }
};

// **Obtener el usuario a partir del token JWT**
const getUserFromTokenCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await usersModel.findById(userId).select("-password");

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.send(user);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_GET_USER");
    }
};

// **Actualizar datos del usuario (onboarding)**
const updateUserCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedUser = await usersModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.send(updatedUser);
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_UPDATE_USER");
    }
};

// **Eliminar usuario (hard/soft)**
const deleteUserCtrl = async (req, res) => {
    try {
        const userId = req.user._id;
        const soft = req.query.soft === "false" ? false : true;

        let result;
        if (soft) {
            result = await usersModel.delete({ _id: userId });
        } else {
            result = await usersModel.deleteOne({ _id: userId });
        }

        if (!result) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        res.send({
            message: soft ? "Usuario eliminado (soft delete)" : "Usuario eliminado permanentemente"
        });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_DELETE_USER");
    }
};

// **Recuperación de contraseña**
const forgotPasswordCtrl = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await usersModel.findOne({ email });

        if (!user) {
            return handleHttpError(res, "USER_NOT_FOUND", 404);
        }

        const resetToken = generateVerificationCode();
        const resetTokenExpires = Date.now() + 3600000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpires;
        await user.save();

        res.send({
            message: "Token generado para recuperación",
            resetToken
        });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_FORGOT_PASSWORD");
    }
};

// **Restablecimiento de contraseña**
const resetPasswordCtrl = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await usersModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return handleHttpError(res, "INVALID_OR_EXPIRED_TOKEN", 400);
        }

        const hashedPassword = await encrypt(newPassword);
        user.password = hashedPassword;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.send({ message: "La contraseña ha sido restablecida correctamente" });
    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_RESET_PASSWORD");
    }
};

// **Invitar a un compañero a la compañía**
const inviteUserToCompanyCtrl = async (req, res) => {
    try {
        const { email } = req.body;

        const userId = req.user._id;
        const user = await usersModel.findById(userId).select("company");

        if (!user || !user.company) {
            return handleHttpError(res, "USER_NOT_FOUND_OR_NO_COMPANY", 404);
        }

        const invitedUser = await usersModel.findOne({ email });

        if (invitedUser) {
            if (invitedUser.company && invitedUser.company._id.toString() === user.company._id.toString()) {
                return handleHttpError(res, "USER_ALREADY_IN_COMPANY", 409);
            }

            invitedUser.company = user.company._id;
            invitedUser.role = "guest";
            await invitedUser.save();

            return res.send({ message: `Usuario ${email} invitado a la compañía como guest` });
        } else {
            const invitationToken = Math.floor(100000 + Math.random() * 900000).toString();
            res.send({ message: "Invitación enviada (enviar email de invitación aquí)", invitationToken });
        }

    } catch (err) {
        console.log(err);
        handleHttpError(res, "ERROR_INVITE_USER");
    }
};


const uploadLogo = async(req, res)=>{
    try{
        const user = req.user;
        const buffer = req.file.buffer;
        const originalname = req.file.originalname;
        const file = {
            buffer:buffer,
            originalname:originalname
        };
        const {IpfsHash} = await uploadToPinata(file, originalname);
        await usersModel.findByIdAndUpdate(user._id, {
            $set: { profilePicture: `${process.env.PINATA_GATEWAY}/${IpfsHash}` }
        }, { new: true });
        res.send({message: "logo actualizado"});
    }catch(err){
        console.log(err);
        handleHttpError(res, "ERROR_UPDATE_LOGO");
    }

}



module.exports = {
    registerCtrl,
    verifyEmailCtrl,
    loginCtrl,
    getUserFromTokenCtrl,
    updateUserCtrl,
    deleteUserCtrl,
    forgotPasswordCtrl,
    resetPasswordCtrl,
    inviteUserToCompanyCtrl,
    uploadLogo
};
