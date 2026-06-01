const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: String,
        email: { type: String, unique: true },
        password: String,
        role: { type: String, default: "user" },
        phone: String,
        address: String,
        avatar: { type: String, default: null },
        wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Wishlist" }],
        resetToken: String,
        resetTokenExpire: Date,
        isVerified: { type: Boolean, default: false },
        isBlocked: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);