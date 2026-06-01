const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/product/:productId", reviewController.getProductReviews);
router.post("/", authMiddleware, reviewController.createReview);

module.exports = router;
