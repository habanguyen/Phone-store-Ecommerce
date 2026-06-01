const Brand = require("../models/brand.model");

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });
    const uniqueBrands = Array.from(
      new Map(brands.map((brand) => [brand.slug, brand])).values()
    );
    res.json(uniqueBrands);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const createBrand = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) throw new Error("Brand name is required");

    const normalized = name.trim();
    const slug = slugify(normalized);

    let brand = await Brand.findOne({ slug });
    if (!brand) {
      brand = await Brand.create({ name: normalized, slug });
    }

    res.status(201).json(brand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { name } = req.body;
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    if (!name) throw new Error('Brand name is required');

    brand.name = name.trim();
    brand.slug = slugify(brand.name);
    await brand.save();
    res.json(brand);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    await brand.remove();
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };
