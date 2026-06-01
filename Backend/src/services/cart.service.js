const Cart = require("../models/cart.model");
const Product = require("../models/product.model");

// add to cart
const addToCart = async (userId, data) => {
    const { productId, size, color, quantity } = data;

    const product = await Product.findById(productId);

    const matchVariant = (variant) => {
        const variantSize = variant.size ?? variant.storage ?? '';
        const variantColor = variant.color ?? variant.color_name ?? '';
        return variantSize === size && variantColor === color;
    };

    const variant = product.variants.find(matchVariant);

    if (!variant) throw new Error("Variant not found");

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
        (item) =>
            item.product.toString() === productId &&
            item.size === size &&
            item.color === color
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            product: productId,
            size,
            color,
            quantity,
            price: variant.price
        });
    }

    //  total
    cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return await cart.save();
};

// get cart
const getCart = async (userId) => {
    return await Cart.findOne({ user: userId }).populate({ path: "items.product", model: "Product" });
};

// update item
const updateItem = async (userId, itemId, quantity) => {
    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new Error("Cart not found");

    const item = cart.items.find(
        (item) => item._id.toString() === itemId
    );
    if (!item) throw new Error("Item not found");

    if (quantity <= 0) {
        cart.items = cart.items.filter(
            (item) => item._id.toString() !== itemId
        );
    } else {
        item.quantity = quantity;
    }

    cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return await cart.save();
};

// remove item
const removeItem = async (userId, itemId) => {
    const cart = await Cart.findOne({ user: userId });

    cart.items = cart.items.filter(
        (item) => item._id.toString() !== itemId
    );

    cart.totalPrice = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return await cart.save();
};

module.exports = {
    addToCart,
    getCart,
    updateItem,
    removeItem
};