const express = require("express");
const router = express.Router();

const couponController = require("../controllers/coupon.controller");
const { authMiddleware, adminOrStaffMiddleware } = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, adminOrStaffMiddleware, couponController.getCoupons);
router.post("/", authMiddleware, adminOrStaffMiddleware, couponController.createCoupon);
router.put("/:id", authMiddleware, adminOrStaffMiddleware, couponController.updateCoupon);
router.delete("/:id", authMiddleware, adminOrStaffMiddleware, couponController.deleteCoupon);
router.post("/validate", authMiddleware, couponController.validate);

module.exports = router;