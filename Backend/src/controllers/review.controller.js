const Review = require("../models/review.model");
const Product = require("../models/product.model");

const createReview = async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;
        if (!productId || !rating) {
            throw new Error("Product and rating are required.");
        }
        if (rating < 1 || rating > 5) {
            throw new Error("Rating must be between 1 and 5.");
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const review = await Review.create({
            user: req.user.id,
            product: productId,
            rating,
            title,
            comment,
            isApproved: true
        });

        res.status(201).json(review);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId, isApproved: true })
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        const averageRating = reviews.length
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
            : 0;
        res.json({ reviews, averageRating, reviewCount: reviews.length });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { createReview, getProductReviews };
