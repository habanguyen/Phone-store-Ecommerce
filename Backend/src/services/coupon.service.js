const Coupon = require("../models/coupon.model");

const validateCoupon = async (code, totalPrice, items = []) => {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon || !coupon.isActive) {
        throw new Error("Coupon not found");
    }

    // check expired
    if (coupon.expiredAt && coupon.expiredAt < new Date()) {
        throw new Error("Coupon expired");
    }

    // check usage
    if (coupon.usageLimit > 0 && coupon.used >= coupon.usageLimit) {
        throw new Error("Coupon usage limit reached");
    }

    let eligibleTotal = totalPrice;
    if (coupon.applyTo === 'product') {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('No cart items provided for product coupon');
        }

        const productIds = coupon.productIds.map((id) => id.toString());
        eligibleTotal = items.reduce((sum, item) => {
            const itemId = item.product?.toString ? item.product.toString() : String(item.product);
            if (productIds.includes(itemId)) {
                return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
            }
            return sum;
        }, 0);

        if (eligibleTotal <= 0) {
            throw new Error('Coupon not applicable to selected products');
        }
    }

    // check min order
    if (eligibleTotal < coupon.minOrder) {
        throw new Error("Not enough order value");
    }

    // calculate discount
    let discount = 0;

    if (coupon.type === "percent") {
        discount = (eligibleTotal * coupon.value) / 100;
    } else {
        discount = coupon.applyTo === 'product' ? Math.min(coupon.value, eligibleTotal) : coupon.value;
    }

    return {
        coupon,
        discount
    };
};

const increaseUsage = async (couponId) => {
    await Coupon.findByIdAndUpdate(couponId, {
        $inc: { used: 1 }
    });
};

module.exports = {
    validateCoupon,
    increaseUsage
};