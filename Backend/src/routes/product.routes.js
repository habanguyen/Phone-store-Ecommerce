const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");
const { uploadProductFiles } = require("../middlewares/upload.middleware");
const { validateProductPayload } = require("../middlewares/product.middleware");

// middleware
const {
    authMiddleware,
    adminOrStaffMiddleware
} = require("../middlewares/auth.middleware");

// CREATE (admin/staff)
router.post(
    "/",
    authMiddleware,
    adminOrStaffMiddleware,
    uploadProductFiles,
    validateProductPayload,
    productController.createProduct
);

// GET ALL
router.get("/", productController.getProducts);
router.get("/export", authMiddleware, adminOrStaffMiddleware, productController.exportProducts);

// GET DETAIL
router.get("/:id", productController.getProduct);

// UPDATE (admin/staff)
router.put(
    "/:id",
    authMiddleware,
    adminOrStaffMiddleware,
    uploadProductFiles,
    validateProductPayload,
    productController.updateProduct
);

// DELETE (admin/staff)
router.delete(
    "/:id",
    authMiddleware,
    adminOrStaffMiddleware,
    productController.deleteProduct
);

module.exports = router;