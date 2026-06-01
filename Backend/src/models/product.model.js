const mongoose = require('mongoose');
require('./productImage.model');

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, trim: true },
    storage: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    is_active: { type: Boolean, default: true }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true },
        brand: { type: String, required: true, trim: true },
        category: { type: String, required: true, trim: true },
        brandRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
        categoryRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
        description: { type: String, required: true, trim: true },
        thumbnail: { type: String, trim: true },
        images: [{ type: String }],
        variants: { type: [variantSchema], default: [] },
        base_price: { type: Number, min: 0 },
        sale_price: { type: Number, min: 0 },
        is_active: { type: Boolean, default: true },
        is_featured: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);