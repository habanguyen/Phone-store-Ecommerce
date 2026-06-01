const cartService = require("../services/cart.service");

// add
const addToCart = async (req, res) => {
    try {
        const cart = await cartService.addToCart(req.user._id, req.body);
        res.json(cart);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// get cart
const getCart = async (req, res) => {
    try {
        const cart = await cartService.getCart(req.user._id);
        res.json(cart);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// update quantity
const updateItem = async (req, res) => {
    try {
        const cart = await cartService.updateItem(
            req.user._id,
            req.params.itemId,
            req.body.quantity
        );
        res.json(cart);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// remove
const removeItem = async (req, res) => {
    try {
        const cart = await cartService.removeItem(
            req.user._id,
            req.params.itemId
        );
        res.json(cart);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    addToCart,
    getCart,
    updateItem,
    removeItem
};