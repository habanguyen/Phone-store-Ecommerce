const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: Number,
    size: String,
    color: String,
    quantity: Number
});

const orderSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

        items: [orderItemSchema],
        orderItemsRef: [{ type: mongoose.Schema.Types.ObjectId, ref: "OrderItem" }],

        totalPrice: {
            type: Number,
            required: true
        },

        // 🔥 thêm phần coupon
        discount: {
            type: Number,
            default: 0
        },

        finalPrice: {
            type: Number,
            required: true
        },

        coupon: {
            type: String,
            default: null
        },

        status: {
            type: String,
            enum: ["pending", "confirmed", "shipping", "delivered", "cancelled"],
            default: "pending"
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending"
        },

        paymentMethod: {
            type: String,
            enum: ["cod", "bank_transfer", "stripe"],
            default: "cod"
        },

        refundStatus: {
            type: String,
            enum: ["none", "requested", "processing", "completed", "rejected"],
            default: "none"
        },

        refundAmount: {
            type: Number,
            default: 0
        },

        shippingFee: {
            type: Number,
            default: 0
        },

        tax: {
            type: Number,
            default: 0
        },

        shippingAddress: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);