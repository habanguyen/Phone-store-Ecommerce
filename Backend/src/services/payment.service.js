
const Stripe = require("stripe");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey || stripeSecretKey.includes("your_stripe_secret_key_here")) {
    throw new Error("Stripe secret key chưa được cấu hình. Vui lòng đặt STRIPE_SECRET_KEY trong Backend/.env.");
}

const stripe = new Stripe(stripeSecretKey);

const createCheckoutSession = async (order) => {
    const lineItems = order.items.map(item => ({
        price_data: {
            currency: "vnd",
            product_data: {
                name: item.name
            },
            unit_amount: item.price
        },
        quantity: item.quantity
    }));

    if (order.shippingFee > 0) {
        lineItems.push({
            price_data: {
                currency: "vnd",
                product_data: {
                    name: "Phí vận chuyển"
                },
                unit_amount: order.shippingFee
            },
            quantity: 1
        });
    }

    if (order.tax > 0) {
        lineItems.push({
            price_data: {
                currency: "vnd",
                product_data: {
                    name: "Thuế VAT"
                },
                unit_amount: order.tax
            },
            quantity: 1
        });
    }

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],

        line_items: lineItems,

        mode: "payment",

        success_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}/cancel`,

        metadata: {
            orderId: order._id.toString()
        }
    });

    return session;
};

module.exports = { createCheckoutSession };