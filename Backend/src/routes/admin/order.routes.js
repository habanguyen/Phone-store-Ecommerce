const express = require("express");
const router = express.Router();

const ctrl = require("../../controllers/admin/order.controller");
const { authMiddleware, adminOrStaffMiddleware } = require("../../middlewares/auth.middleware");

// admin/staff order endpoints
router.get("/", authMiddleware, adminOrStaffMiddleware, ctrl.getOrdersAdmin);
router.get("/export", authMiddleware, adminOrStaffMiddleware, ctrl.exportOrders);
router.get("/:id", authMiddleware, adminOrStaffMiddleware, ctrl.getOrderDetail);
router.get("/:id/refunds", authMiddleware, adminOrStaffMiddleware, ctrl.getRefundLogs);
router.get("/:id/invoice", authMiddleware, adminOrStaffMiddleware, ctrl.getInvoice);
router.put("/:id/status", authMiddleware, adminOrStaffMiddleware, ctrl.updateOrderStatus);
router.put("/:id/refund-status", authMiddleware, adminOrStaffMiddleware, ctrl.updateRefundStatus);

module.exports = router;