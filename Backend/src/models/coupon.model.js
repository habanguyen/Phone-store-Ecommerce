const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["percent", "fixed"],
            required: true
        },

        value: {
            type: Number,
            required: true
        },

        minOrder: {
            type: Number,
            default: 0
        },

        applyTo: {
            type: String,
            enum: ["order", "product"],
            default: "order"
        },

        productIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ],

        expiredAt: {
            type: Date
        },

        usageLimit: {
            type: Number,
            default: 0
        },

        used: {
            type: Number,
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);