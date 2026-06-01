const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    price: Number,
    size: String,
    color: String,
    quantity: Number,
    thumbnail: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OrderItem", orderItemSchema);
