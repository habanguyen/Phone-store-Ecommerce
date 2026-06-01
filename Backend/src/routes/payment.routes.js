const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/checkout/:id", authMiddleware, paymentController.checkout);
router.post("/webhook", paymentController.webhook);

module.exports = router;