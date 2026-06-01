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
        const { code, type, value, minOrder, expiredAt, usageLimit, isActive, applyTo, productIds } = req.body;
        if (!code || !type || value == null) throw new Error('Code, type and value are required');
        if (applyTo === 'product' && (!productIds || !Array.isArray(productIds) || productIds.length === 0)) {
            throw new Error('Product coupons must include at least one product ID');
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase().trim(),
            type,
            value,
            minOrder: minOrder || 0,
            applyTo: applyTo || 'order',
            productIds: Array.isArray(productIds) ? productIds : [],
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
        const { code, type, value, minOrder, expiredAt, usageLimit, isActive, applyTo, productIds } = req.body;
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });

        if (code) coupon.code = code.toUpperCase().trim();
        if (type) coupon.type = type;
        if (value != null) coupon.value = value;
        coupon.minOrder = minOrder || 0;
        if (applyTo) coupon.applyTo = applyTo;
        if (productIds) coupon.productIds = Array.isArray(productIds) ? productIds : [];
        if (coupon.applyTo === 'product' && (!coupon.productIds || coupon.productIds.length === 0)) {
            throw new Error('Product coupons must include at least one product ID');
        }
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
            coupon: {
                code: result.coupon.code,
                type: result.coupon.type,
                value: result.coupon.value,
                minOrder: result.coupon.minOrder,
                expiredAt: result.coupon.expiredAt,
                usageLimit: result.coupon.usageLimit,
                used: result.coupon.used,
                isActive: result.coupon.isActive
            },
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
