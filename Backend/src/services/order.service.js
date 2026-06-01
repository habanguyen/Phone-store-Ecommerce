const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const couponService = require("./coupon.service");
const emailService = require("./email.service");
const RefundLog = require("../models/refund.model");

// CREATE ORDER
const createOrder = async (userId, data) => {
    const { shippingAddress, couponCode, paymentMethod = 'cod' } = data;

    // 1. lấy cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    // 2. build order items (snapshot)
    const orderItems = [];

    for (const item of cart.items) {
        const product = await Product.findById(item.product);

        if (!product) {
            throw new Error("Product not found");
        }

        orderItems.push({
            product: product._id,
            name: product.name,
            price: item.price,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            thumbnail: product.thumbnail || ''
        });
    }

    // 3. xử lý coupon
    let discount = 0;
    let couponUsed = null;

    if (couponCode) {
        const result = await couponService.validateCoupon(
            couponCode,
            cart.totalPrice,
            cart.items
        );

        discount = result.discount;
        couponUsed = result.coupon;

        // tăng số lần sử dụng
        await couponService.increaseUsage(couponUsed._id);
    }

    // 4. calculate shipping, tax and final price
    const shippingFee = Number(data.shippingFee) || 0;
    const tax = data.tax != null ? Number(data.tax) : 0;
    const finalPrice = Math.max(cart.totalPrice - discount + shippingFee + tax, 0);

    // 5. create order
    const order = new Order({
        user: userId,
        items: orderItems,
        totalPrice: cart.totalPrice,
        discount,
        shippingFee,
        tax,
        finalPrice,
        coupon: couponUsed ? couponUsed.code : null,
        shippingAddress,
        paymentMethod,
        status: "pending"
    });

    await order.save();

    if (paymentMethod !== 'stripe') {
        const existingCart = await Cart.findOne({ user: userId });
        if (existingCart) {
            existingCart.items = [];
            existingCart.totalPrice = 0;
            await existingCart.save();
        }

        try {
            const user = await User.findById(userId);
            if (user && user.email) {
                await emailService.sendOrderConfirmation(order, user);
            }
        } catch (err) {
            console.error("Failed to send order confirmation email:", err.message || err);
        }
    }

    return order;
};

// GET MY ORDERS
const getMyOrders = async (userId) => {
    return await Order.find({ user: userId }).sort({ createdAt: -1 });
};

// ADMIN: GET ALL
const getAllOrders = async () => {
    return await Order.find().populate("user").sort({ createdAt: -1 });
};

const getOrdersAdmin = async () => {
    return await Order.find().populate("user").sort({ createdAt: -1 });
};

// ADMIN: GET ORDER DETAIL
const getOrderDetail = async (orderId) => {
    const order = await Order.findById(orderId).populate("user");
    if (!order) throw new Error("Order not found");
    return order;
};

// Define valid status transitions (state machine)
const STATUS_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipping', 'cancelled'],
    shipping: ['delivered', 'cancelled'],
    delivered: [], // final state, cannot transition
    cancelled: [] // terminal state, cannot transition
};

// Validate status transition
const isValidStatusTransition = (currentStatus, newStatus) => {
    if (!STATUS_TRANSITIONS[currentStatus]) {
        return false;
    }
    return STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};

// Get available next statuses for a given current status
const getAvailableStatuses = (currentStatus) => {
    return STATUS_TRANSITIONS[currentStatus] || [];
};

// UPDATE STATUS
const updateStatus = async (orderId, status) => {
    const order = await Order.findById(orderId);

    if (!order) throw new Error("Order not found");

    // Validate status transition
    if (!isValidStatusTransition(order.status, status)) {
        const availableStatuses = getAvailableStatuses(order.status);
        throw new Error(
            `Invalid status transition from '${order.status}' to '${status}'. ` +
            `Available statuses: ${availableStatuses.length > 0 ? availableStatuses.join(', ') : 'none (terminal state)'}`
        );
    }

    order.status = status;

    if (status === 'confirmed' && ['bank_transfer', 'stripe'].includes(order.paymentMethod) && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
    }

    const saved = await order.save();

    // Auto-generate PDF invoice when order is completed/delivered
    try {
        if (status === 'delivered') {
            const user = await User.findById(order.user);
            const pdfBuffer = await emailService.generateInvoicePDF(saved, user);
            const fs = require('fs');
            const path = require('path');
            const dir = path.join(__dirname, '..', '..', 'uploads', 'invoices');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const filePath = path.join(dir, `invoice-${order._id}.pdf`);
            fs.writeFileSync(filePath, pdfBuffer);
        }
    } catch (err) {
        console.error('Failed to generate invoice PDF on status update:', err.message || err);
    }

    return saved;
};

const cancelOrder = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) throw new Error("Order not found");
    if (order.status !== 'pending' || order.paymentStatus === 'paid') {
        throw new Error("Cannot cancel this order");
    }

    order.status = 'cancelled';
    return await order.save();
};

const requestRefund = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) throw new Error("Order not found");
    if (order.paymentMethod === 'cod') throw new Error("Refund is not available for cash on delivery orders");
    if (order.paymentStatus !== 'paid') throw new Error("Order must be paid before requesting a refund");
    if (order.status !== 'cancelled') throw new Error("Refund request is only available for cancelled orders");
    if (order.refundStatus !== 'none') throw new Error("Refund request has already been submitted");

    order.refundStatus = 'requested';
    order.refundAmount = order.finalPrice;

    const saved = await order.save();

    // create refund log
    try {
        await RefundLog.create({ order: order._id, action: 'requested', amount: order.refundAmount });
    } catch (err) {
        console.error('Failed to create refund log:', err.message || err);
    }

    return saved;
};

const getRefundStatus = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw new Error("Order not found");
    return {
        refundStatus: order.refundStatus,
        refundAmount: order.refundAmount
    };
};

const updateRefundStatus = async (orderId, refundStatus) => {
    const validStatuses = ["requested", "processing", "completed", "rejected"];
    if (!validStatuses.includes(refundStatus)) {
        throw new Error("Invalid refund status");
    }

    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");
    if (order.paymentMethod === 'cod') {
        throw new Error("Refund actions are not available for cash on delivery orders");
    }

    order.refundStatus = refundStatus;
    if (refundStatus === 'completed') {
        order.paymentStatus = 'refunded';
    }

    const saved = await order.save();

    // log refund action
    try {
        await RefundLog.create({ order: order._id, action: refundStatus, amount: order.refundAmount });
    } catch (err) {
        console.error('Failed to create refund log:', err.message || err);
    }

    return saved;
};

const getRefundLogs = async (orderId) => {
    return await RefundLog.find({ order: orderId }).populate('admin', 'name email').sort({ createdAt: -1 });
};

const updateOrderStatus = async (orderId, status) => {
    return await updateStatus(orderId, status);
};

module.exports = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrdersAdmin,
    getOrderDetail,
    cancelOrder,
    updateStatus,
    updateOrderStatus,
    requestRefund,
    getRefundStatus,
    updateRefundStatus,
    getRefundLogs,
    getAvailableStatuses,
    isValidStatusTransition
};