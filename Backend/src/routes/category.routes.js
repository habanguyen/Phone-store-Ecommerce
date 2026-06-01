const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { authMiddleware, adminOrStaffMiddleware } = require("../middlewares/auth.middleware");

router.get("/", categoryController.getCategories);
router.post("/", authMiddleware, adminOrStaffMiddleware, categoryController.createCategory);
router.put("/:id", authMiddleware, adminOrStaffMiddleware, categoryController.updateCategory);
router.delete("/:id", authMiddleware, adminOrStaffMiddleware, categoryController.deleteCategory);

module.exports = router;
