const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

console.log('auth.routes.js loaded');

router.post("/send-otp", authController.sendOTP);
router.post("/test-email", authController.testEmail);
router.post("/verify-otp", authController.verifyOTP);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", authMiddleware, (req, res) => {
    res.json(req.user);
});
router.put("/me", authMiddleware, authController.updateProfile);
router.put("/me/password", authMiddleware, authController.changePassword);
router.post("/me/send-delete-otp", authMiddleware, authController.sendDeleteAccountOTP);
router.delete("/me", authMiddleware, authController.deleteAccount);

module.exports = router;