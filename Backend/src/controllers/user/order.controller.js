const Order = require("../../models/order.model");
const orderService = require("../../services/order.service");

// CREATE ORDER
const createOrder = async (req, res) => {
    try {
        const order = await orderService.createOrder(req.user.id, req.body);
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET MY ORDERS
const getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
        .sort({ createdAt: -1 });

    res.json(orders);
};

// GET ORDER DETAIL
const getOrderDetail = async (req, res) => {
    const order = await Order.findOne({
        _id: req.params.id,
        user: req.user.id
    });

    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
};

const cancelOrder = async (req, res) => {
    try {
        const order = await orderService.cancelOrder(req.params.id, req.user.id);
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const requestRefund = async (req, res) => {
    try {
        const order = await orderService.requestRefund(req.params.id, req.user.id);
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const getRefundStatus = async (req, res) => {
    try {
        const result = await orderService.getRefundStatus(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderDetail,
    cancelOrder,
    requestRefund,
    getRefundStatus
};