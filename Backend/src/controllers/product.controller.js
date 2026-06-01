const ExcelJS = require("exceljs");
const productService = require("../services/product.service");

// CREATE
const buildImagePaths = (files) => {
    if (!files) return [];
    return files.map((file) => `/uploads/products/${file.filename}`);
};

const createProduct = async (req, res, next) => {
    try {
        const payload = {
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            description: req.body.description,
            slug: req.body.slug,
            thumbnail: req.body.thumbnail?.toString().trim() || '',
            variants: req.body.variants,
            existingImages: req.body.existingImages || []
        };

        const uploadedImages = buildImagePaths(req.files?.images);
        if (req.files?.thumbnail?.[0]) {
            payload.thumbnail = `/uploads/products/${req.files.thumbnail[0].filename}`;
        }

        payload.images = [...payload.existingImages, ...uploadedImages];
        if (!payload.thumbnail && payload.images.length) {
            payload.thumbnail = payload.images[0];
        }

        const product = await productService.createProduct(payload);
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
};

// GET ALL
const getProducts = async (req, res, next) => {
    try {
        const products = await productService.getProducts(req.query);
        res.json(products);
    } catch (err) {
        next(err);
    }
};

const exportProducts = async (req, res, next) => {
    try {
        const products = await productService.getProducts(req.query);
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Products');

        sheet.columns = [
            { header: 'ID', key: '_id', width: 30 },
            { header: 'Tên', key: 'name', width: 30 },
            { header: 'Thương hiệu', key: 'brand', width: 25 },
            { header: 'Danh mục', key: 'category', width: 25 },
            { header: 'Giá thấp nhất', key: 'minPrice', width: 15 },
            { header: 'Giá cao nhất', key: 'maxPrice', width: 15 },
            { header: 'Tồn kho', key: 'stock', width: 15 },
            { header: 'Số lượng variant', key: 'variantCount', width: 15 },
            { header: 'Ngày tạo', key: 'createdAt', width: 20 },
            { header: 'Ảnh chính', key: 'thumbnail', width: 50 }
        ];

        products.forEach((product) => {
            const variants = Array.isArray(product.variants) ? product.variants : [];
            const prices = variants.map((v) => Number(v.price) || 0).filter((p) => p > 0);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;
            const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

            sheet.addRow({
                _id: product._id,
                name: product.name || '',
                brand: product.brand || product.brandRef?.name || '',
                category: product.category || product.categoryRef?.name || '',
                minPrice,
                maxPrice,
                stock: totalStock,
                variantCount: variants.length,
                createdAt: product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : '',
                thumbnail: product.thumbnail || ''
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        next(err);
    }
};

// GET DETAIL
const getProduct = async (req, res, next) => {
    try {
        const product = await productService.getProductById(req.params.id);
        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }
        res.json(product);
    } catch (err) {
        next(err);
    }
};

// UPDATE
const updateProduct = async (req, res, next) => {
    try {
        const payload = {
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            description: req.body.description,
            slug: req.body.slug,
            thumbnail: req.body.thumbnail?.toString().trim() || '',
            variants: req.body.variants,
            existingImages: req.body.existingImages || []
        };

        const uploadedImages = buildImagePaths(req.files?.images);
        if (req.files?.thumbnail?.[0]) {
            payload.thumbnail = `/uploads/products/${req.files.thumbnail[0].filename}`;
        }

        payload.images = [...payload.existingImages, ...uploadedImages];
        if (!payload.thumbnail && payload.images.length) {
            payload.thumbnail = payload.images[0];
        }

        const product = await productService.updateProduct(req.params.id, payload);
        res.json(product);
    } catch (err) {
        next(err);
    }
};

// DELETE
const deleteProduct = async (req, res, next) => {
    try {
        await productService.deleteProduct(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createProduct,
    getProducts,
    exportProducts,
    getProduct,
    updateProduct,
    deleteProduct
};