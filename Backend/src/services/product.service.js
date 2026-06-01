const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Brand = require("../models/brand.model");
const Category = require("../models/category.model");

const slugify = (value) =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

const findOrCreateBrand = async (brandValue) => {
    if (!brandValue || !brandValue.toString().trim()) return null;
    const name = brandValue.toString().trim();
    const existing = await Brand.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") });
    if (existing) return existing;
    return await Brand.create({ name, slug: slugify(name) });
};

const findOrCreateCategory = async (categoryValue) => {
    if (!categoryValue || !categoryValue.toString().trim()) return null;
    const name = categoryValue.toString().trim();
    const existing = await Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") });
    if (existing) return existing;
    return await Category.create({ name, slug: slugify(name) });
};

const normalizeProductData = async (data) => {
    const payload = { ...data };

    if (!payload.slug && payload.name) {
        payload.slug = slugify(payload.name);
    }

    if (payload.images && Array.isArray(payload.images)) {
        payload.images = Array.from(new Set(payload.images.map((img) => img?.toString().trim()).filter(Boolean)));
    }

    if (payload.variants && Array.isArray(payload.variants)) {
        const seen = new Set();
        payload.variants = payload.variants.filter((variant) => {
            const storage = (variant.storage || variant.size || '').toString().trim().toLowerCase();
            const color = (variant.color || variant.color_name || '').toString().trim().toLowerCase();
            const key = `${storage}|${color}`;
            if (!storage || !color || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    if (payload.brandRef) {
        if (mongoose.Types.ObjectId.isValid(payload.brandRef)) {
            const brandDoc = await Brand.findById(payload.brandRef);
            if (brandDoc) payload.brand = brandDoc.name;
        }
    } else if (payload.brand) {
        const brandDoc = await findOrCreateBrand(payload.brand);
        if (brandDoc) {
            payload.brandRef = brandDoc._id;
            payload.brand = brandDoc.name;
        }
    }

    if (payload.categoryRef) {
        if (mongoose.Types.ObjectId.isValid(payload.categoryRef)) {
            const categoryDoc = await Category.findById(payload.categoryRef);
            if (categoryDoc) payload.category = categoryDoc.name;
        }
    } else if (payload.category) {
        const categoryDoc = await findOrCreateCategory(payload.category);
        if (categoryDoc) {
            payload.categoryRef = categoryDoc._id;
            payload.category = categoryDoc.name;
        }
    }

    return payload;
};

const createProduct = async (data) => {
    const payload = await normalizeProductData(data);

    if (payload.variants && Array.isArray(payload.variants) && payload.variants.length > 0) {
        payload.variants = payload.variants.map((variant) => ({
            ...variant,
            price: Number(variant.price),
            stock: Number(variant.stock)
        }));
        payload.base_price = Math.min(...payload.variants.map((variant) => variant.price));
    }

    return await Product.create(payload);
};

// GET ALL + SEARCH + FILTER
const getProducts = async (query) => {
    const { keyword, minPrice, maxPrice, category } = query;

    const filter = { isDeleted: false };

    if (keyword) {
        const regex = new RegExp(escapeRegex(keyword), "i");
        filter.$or = [
            { name: regex },
            { description: regex },
            { brand: regex },
            { category: regex }
        ];
    }

    if (category) {
        const categoryFilters = [
            { category: category },
            { category: new RegExp(`^${escapeRegex(category)}$`, "i") }
        ];

        if (mongoose.Types.ObjectId.isValid(category)) {
            categoryFilters.push({ categoryRef: category });
        }

        filter.$and = filter.$and || [];
        filter.$and.push({ $or: categoryFilters });
    }

    let products = await Product.find(filter)
        .populate("brandRef")
        .populate("categoryRef");

    if (minPrice || maxPrice) {
        products = products.filter((p) =>
            p.variants.some((v) => {
                return (
                    (!minPrice || v.price >= minPrice) &&
                    (!maxPrice || v.price <= maxPrice)
                );
            })
        );
    }

    return products;
};

// GET DETAIL
const getProductById = async (id) => {
    return await Product.findById(id)
        .populate("brandRef")
        .populate("categoryRef");
};

// UPDATE
const updateProduct = async (id, data) => {
    const payload = await normalizeProductData(data);

    if (payload.variants && Array.isArray(payload.variants) && payload.variants.length > 0) {
        payload.variants = payload.variants.map((variant) => ({
            ...variant,
            price: Number(variant.price),
            stock: Number(variant.stock)
        }));
        payload.base_price = Math.min(...payload.variants.map((variant) => variant.price));
    }

    return await Product.findByIdAndUpdate(id, payload, { new: true })
        .populate("brandRef")
        .populate("categoryRef");
};

// DELETE (soft)
const deleteProduct = async (id) => {
    return await Product.findByIdAndUpdate(id, { isDeleted: true });
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};