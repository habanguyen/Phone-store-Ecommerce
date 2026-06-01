const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/user/order.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, ctrl.createOrder);
router.get("/my", authMiddleware, ctrl.getMyOrders);
router.put("/:id/refund", authMiddleware, ctrl.requestRefund);
router.get("/:id/refund", authMiddleware, ctrl.getRefundStatus);

module.exports = router;