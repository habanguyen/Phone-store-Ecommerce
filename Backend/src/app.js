require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const createAdminUser = require("./utils/createAdminUser");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const cors = require("cors");

const app = express();

const startServer = async () => {
    await connectDB();
    await createAdminUser();

    // middleware
    app.use(cors());
    app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

    // routes
    app.use("/api/auth", require("./routes/auth.routes"));

    // test route
    app.get("/", (req, res) => {
        res.send("API is running...");
    });
    // product routes
    app.use("/api/products", require("./routes/product.routes"));
    // brand/category routes
    app.use("/api/brands", require("./routes/brand.routes"));
    app.use("/api/categories", require("./routes/category.routes"));
    // cart routes
    app.use("/api/cart", require("./routes/cart.routes"));
    // review routes
    app.use("/api/reviews", require("./routes/review.routes"));
    // order routes
    app.use("/api/orders", require("./routes/order.routes"));
    // coupon routes
    app.use("/api/coupons", require("./routes/coupon.routes"));
    // contact routes
    app.use("/api/contacts", require("./routes/contact.routes"));
    // admin contact routes
    app.use("/api/admin/contacts", require("./routes/admin/contact.routes"));
    // payment routes
    app.use("/api/payments", require("./routes/payment.routes"));
    // dashboard routes
    app.use("/api/dashboard", require("./routes/dashboard.routes"));
    // admin order routes
    app.use("/api/admin/orders", require("./routes/admin/order.routes"));
    // admin user management
    app.use("/api/admin/users", require("./routes/admin/user.routes"));
    // user order routes
    app.use("/api/user/orders", require("./routes/user/order.routes"));
    // AI recommendation routes
    app.use("/api/ai", require("./routes/ai.routes"));

    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();