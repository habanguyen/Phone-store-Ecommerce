const Category = require("../models/category.model");

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const uniqueCategories = Array.from(
      new Map(categories.map((category) => [category.slug, category])).values()
    );
    res.json(uniqueCategories);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name) throw new Error("Category name is required");

    const normalized = name.trim();
    const slug = slugify(normalized);

    let category = await Category.findOne({ slug });
    if (!category) {
      category = await Category.create({ name: normalized, slug, parent: parent || null });
    }

    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    if (!name) throw new Error('Category name is required');

    category.name = name.trim();
    category.slug = slugify(category.name);
    category.parent = parent || null;
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    await category.remove();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
