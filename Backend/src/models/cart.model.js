const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },

    size: String,
    color: String,

    quantity: Number,
    price: Number
});

const cartSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        items: [cartItemSchema],
        totalPrice: { type: Number, default: 0 }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);