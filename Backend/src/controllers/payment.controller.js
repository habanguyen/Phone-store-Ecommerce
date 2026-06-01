const Stripe = require("stripe");
const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const paymentService = require("../services/payment.service");
const emailService = require("../services/email.service");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// create stripe session
const checkout = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) throw new Error("Order not found");
        if (order.user.toString() !== req.user.id) throw new Error("Unauthorized");
        if (order.paymentMethod !== 'stripe') throw new Error('Order payment method is not Stripe');

        const session = await paymentService.createCheckoutSession(order);

        res.json({
            url: session.url
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// handle stripe webhook
const webhook = async (req, res) => {
    let event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        if (webhookSecret && webhookSecret !== 'your_webhook_secret_here') {
            const signature = req.headers['stripe-signature'];
            event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        } else {
            event = JSON.parse(req.body.toString());
        }
    } catch (err) {
        console.error('Stripe webhook signature verification failed:', err.message || err);
        return res.status(400).json({ message: 'Webhook signature verification failed.' });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata.orderId;
        const order = await Order.findById(orderId).populate("user");

        if (order && order.paymentStatus !== "paid") {
            order.paymentStatus = "paid";
            order.status = "confirmed";
            await order.save();

            const cart = await Cart.findOne({ user: order.user._id });
            if (cart) {
                cart.items = [];
                cart.totalPrice = 0;
                await cart.save();
            }

            try {
                if (order.user && order.user.email) {
                    await emailService.sendOrderConfirmation(order, order.user);
                }
            } catch (err) {
                console.error("Failed to send order confirmation email:", err.message || err);
            }
        }
    }

    res.json({ received: true });
};

module.exports = { checkout, webhook };