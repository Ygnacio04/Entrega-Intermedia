const mongoose = require('mongoose');
const mongooseDelete = require("mongoose-delete");

const UserScheme = new mongoose.Schema({
    firstName: { 
        type: String,
        trim: true,
        required: true 
        },

    lastName: { 
        type: String,
        required: true 
    },

    email: { 
        type: String, 
        unique: true, 
        required: true 
    },

    password: { 
        type: String, 
        required: true 
    },

    company:{
        companyName: { 
            type: String,
            trim: true 
        },
    
        companyCif: { 
            type: String,
            trim: true 
        },
    
        companyStreet: { 
            type: String, 
            trim: true 
        },
    
        companyNumber: { 
            type: Number, 
            min: 0 
        },
    
        companyPostal: { 
            type: Number,
            min: 0 
        },
    
        companyCity: { 
            type: String,
            trim: true 
        },
    
        companyPartners: [{
            partnerId: { 
                type: String,
                required: true 
            },
            partnerRole: { 
                type: String,
                enum: ["admin", "user"],
                required: true, 
                default: "user"
            }
        }],
    },

    validated: { 
        type: Boolean,
        default: false 
    },

    status: {
        validated: { 
            type: Boolean,
            default: false 
        },

        active: { 
            type: Boolean,
            default: false
        },

        verificationCode: {
            type: String 
        },

        passwordResetCode: { 
            type: String 
        },

        loginAttempts: { 
            type: Number,
            default: 3 
        },
    }
}, {
    timestamps: true,
    versionKey: false
});

UserScheme.index({ 'email': 1 }, { unique: true });
UserScheme.index({ 'companyName': 1 }, { unique: true });
UserScheme.index({ 'companyCif': 1 }, { unique: true });

UserScheme.plugin(mongooseDelete, { overrideMethods: "all" }); 

module.exports = mongoose.model('User', UserScheme);
