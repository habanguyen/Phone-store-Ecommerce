const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

// chỉ admin mới xem được
router.get("/overview", authMiddleware, adminMiddleware, dashboardController.overview);
router.get("/top-products", authMiddleware, adminMiddleware, dashboardController.topProducts);
router.get("/revenue/series", authMiddleware, adminMiddleware, dashboardController.revenueSeries);
router.get("/revenue/summary", authMiddleware, adminMiddleware, dashboardController.revenueSummary);
router.get("/revenue/report", authMiddleware, adminMiddleware, dashboardController.revenueReport);
router.get("/revenue/export", authMiddleware, adminMiddleware, dashboardController.exportRevenue);

module.exports = router;