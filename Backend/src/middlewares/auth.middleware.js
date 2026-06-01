const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// check login
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token" });
        }

        try {
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: "Server error" });
        }
    });
};

const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
    }
    next();
};

const adminMiddleware = authorizeRoles("admin");
const adminOrStaffMiddleware = authorizeRoles("admin", "staff");

module.exports = { authMiddleware, adminMiddleware, adminOrStaffMiddleware };