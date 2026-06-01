const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brand.controller");
const { authMiddleware, adminOrStaffMiddleware } = require("../middlewares/auth.middleware");

router.get("/", brandController.getBrands);
router.post("/", authMiddleware, adminOrStaffMiddleware, brandController.createBrand);
router.put("/:id", authMiddleware, adminOrStaffMiddleware, brandController.updateBrand);
router.delete("/:id", authMiddleware, adminOrStaffMiddleware, brandController.deleteBrand);

module.exports = router;
