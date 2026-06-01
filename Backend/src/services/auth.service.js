const User = require("../models/user.model");
const OTP = require("../models/otp.model");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const isEmailConfigured = () => {
    return (
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASS &&
        process.env.EMAIL_USER !== 'your-email@gmail.com' &&
        process.env.EMAIL_PASS !== 'your-app-password'
    );
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
const validatePhone = (phone) => /^\d{10,11}$/.test(phone);
const validateName = (name) => typeof name === 'string' && name.trim().length >= 2;
const validateAddress = (address) => typeof address === 'string' && address.trim().length >= 10;

const generateNumericOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const validateRegistrationData = ({ name, email, password, phone, address }) => {
    if (!validateName(name)) {
        throw new Error('Tên phải có ít nhất 2 ký tự.');
    }
    if (!validateEmail(email)) {
        throw new Error('Email không hợp lệ.');
    }
    if (!validatePassword(password)) {
        throw new Error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
    }
    if (!validatePhone(phone)) {
        throw new Error('Số điện thoại phải gồm 10 hoặc 11 chữ số.');
    }
    if (!validateAddress(address)) {
        throw new Error('Địa chỉ phải mô tả chi tiết (số nhà, phường/xã, quận/huyện, thành phố) và ít nhất 10 ký tự.');
    }
};

const createTransporter = () => {
    if (!isEmailConfigured()) return null;

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendOTP = async (email) => {
    const otp = generateNumericOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const transporter = createTransporter();
    if (!transporter) {
        throw new Error('Email configuration is missing or invalid. Set EMAIL_USER and EMAIL_PASS in .env with a real Gmail account and app password.');
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "OTP for Account Verification",
        text: `Your OTP is: ${otp}. It expires in 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        await OTP.create({ email, otp, expiresAt });
        console.log(`OTP sent to ${email}: ${otp}`);
        return { emailSent: true };
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw new Error('Failed to send OTP email: ' + error.message);
    }
};

const verifyOTP = async (email, otp) => {
    const otpString = String(otp || '').trim();
    const otpRecord = await OTP.findOne({ email, otp: otpString });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
        throw new Error("Invalid or expired OTP");
    }

    // Delete OTP after verification
    await OTP.deleteOne({ _id: otpRecord._id });
    return true;
};

const register = async (data) => {
    const { name, email, password, phone, address } = data;

    validateRegistrationData({ name, email, password, phone, address });

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        address
    });

    return user;
};

const login = async (data) => {
    const { email, password } = data;

    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    return user;
};

const forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 3600 * 1000;
    await user.save();

    return resetToken;
};

const resetPassword = async (data) => {
    const { token, password } = data;
    const user = await User.findOne({
        resetToken: token,
        resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) throw new Error("Invalid or expired reset token");

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    return user;
};

const updateProfile = async (userId, data) => {
    const { name, phone, address, avatar } = data;
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (name !== undefined) {
        if (!validateName(name)) {
            throw new Error('Tên phải có ít nhất 2 ký tự.');
        }
        user.name = name.trim();
    }
    if (phone !== undefined) {
        if (phone && !validatePhone(phone)) {
            throw new Error('Số điện thoại phải gồm 10 hoặc 11 chữ số.');
        }
        user.phone = phone;
    }
    if (address !== undefined) {
        if (address && !validateAddress(address)) {
            throw new Error('Địa chỉ phải mô tả chi tiết và ít nhất 10 ký tự.');
        }
        user.address = address;
    }
    if (avatar !== undefined) {
        user.avatar = avatar || null;
    }

    await user.save();
    return user;
};

const changePassword = async (userId, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required.');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('Current password is incorrect.');

    if (!validatePassword(newPassword)) {
        throw new Error('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return user;
};

const sendDeleteAccountOTP = async (user) => {
    return await sendOTP(user.email);
};

const deleteAccount = async (userId, otp) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    await verifyOTP(user.email, otp);
    await user.deleteOne();
    return true;
};
const testEmail = async (to) => {
    if (!isEmailConfigured()) {
        throw new Error('Email is not configured in .env');
    }

    const transporter = createTransporter();
    try {
        // Verify SMTP connection
        await transporter.verify();
    } catch (err) {
        console.error('SMTP verify failed:', err.message || err);
        throw new Error('SMTP verification failed: ' + (err.message || err));
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Test email from app',
        text: 'This is a test email to verify SMTP configuration.'
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Test email sent:', info.response || info);
        return { success: true, info };
    } catch (err) {
        console.error('Test email send failed:', err.message || err);
        throw new Error('Failed to send test email: ' + (err.message || err));
    }
};

module.exports = { sendOTP, verifyOTP, register, login, forgotPassword, resetPassword, updateProfile, changePassword, sendDeleteAccountOTP, deleteAccount, testEmail };