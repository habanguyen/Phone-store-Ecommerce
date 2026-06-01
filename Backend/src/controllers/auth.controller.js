const authService = require("../services/auth.service");
const generateToken = require("../utils/generateToken");

const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await authService.sendOTP(email);
        res.json({
            message: result.emailSent ? "OTP sent to email" : "OTP created in test mode",
            ...(result.emailSent ? {} : { otp: result.otp })
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const testEmail = async (req, res) => {
    try {
        const { to } = req.body;
        const result = await authService.testEmail(to);
        res.json({ message: 'Test email sent', result });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp, name, password, phone, address } = req.body;
        await authService.verifyOTP(email, otp);
        
        // Now register the user
        const user = await authService.register({ name, email, password, phone, address });
        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const register = async (req, res) => {
    try {
        const user = await authService.register(req.body);
        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const user = await authService.login(req.body);
        const token = generateToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address
            }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const resetToken = await authService.forgotPassword(req.body.email);
        res.json({
            message: "Reset token created. Send this token to user email.",
            resetToken
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        await authService.resetPassword(req.body);
        res.json({ message: "Password reset successful." });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await authService.updateProfile(req.user._id, req.body);
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            avatar: user.avatar
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const changePassword = async (req, res) => {
    try {
        await authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword);
        res.json({ message: "Password updated successfully." });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const sendDeleteAccountOTP = async (req, res) => {
    try {
        await authService.sendDeleteAccountOTP(req.user);
        res.json({ message: "OTP sent to your email for account deletion." });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        await authService.deleteAccount(req.user._id, req.body.otp);
        res.json({ message: "Account deleted successfully." });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

module.exports = { sendOTP, verifyOTP, register, login, forgotPassword, resetPassword, updateProfile, changePassword, sendDeleteAccountOTP, deleteAccount, testEmail };