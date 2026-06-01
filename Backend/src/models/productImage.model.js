const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    url: { type: String, required: true },
    altText: String,
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductImage", productImageSchema);
