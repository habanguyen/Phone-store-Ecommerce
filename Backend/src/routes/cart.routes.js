const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, cartController.addToCart);
router.get("/", authMiddleware, cartController.getCart);
router.put("/:itemId", authMiddleware, cartController.updateItem);
router.delete("/:itemId", authMiddleware, cartController.removeItem);

module.exports = router;