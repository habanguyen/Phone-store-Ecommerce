const Coupon = require("../models/coupon.model");
const couponService = require("../services/coupon.service");

const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const createCoupon = async (req, res) => {
    try {
        const { code, type, value, minOrder, expiredAt, usageLimit, isActive } = req.body;
        if (!code || !type || value == null) throw new Error('Code, type and value are required');

        const coupon = await Coupon.create({
            code: code.toUpperCase().trim(),
            type,
            value,
            minOrder: minOrder || 0,
            expiredAt: expiredAt ? new Date(expiredAt) : null,
            usageLimit: usageLimit || 0,
            isActive: isActive !== false
        });

        res.status(201).json(coupon);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateCoupon = async (req, res) => {
    try {
        const { code, type, value, minOrder, expiredAt, usageLimit, isActive } = req.body;
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

        if (code) coupon.code = code.toUpperCase().trim();
        if (type) coupon.type = type;
        if (value != null) coupon.value = value;
        coupon.minOrder = minOrder || 0;
        coupon.expiredAt = expiredAt ? new Date(expiredAt) : coupon.expiredAt;
        coupon.usageLimit = usageLimit || 0;
        coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;

        await coupon.save();
        res.json(coupon);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        await coupon.remove();
        res.json({ message: 'Coupon deleted' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const validate = async (req, res) => {
    try {
        const { code, totalPrice, items } = req.body;
        const result = await couponService.validateCoupon(code, totalPrice, items);
        res.json({
            discount: result.discount,
            message: "Coupon valid"
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = {
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validate
};
