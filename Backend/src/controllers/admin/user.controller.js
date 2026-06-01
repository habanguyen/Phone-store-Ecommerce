const User = require("../../models/user.model");
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    const q = req.query.q;
    let query = {};
    if (q) {
        const re = new RegExp(q, 'i');
        query = { $or: [{ name: re }, { email: re }] };
    }
    const users = await User.find(query).select("-password");
    res.json(users);
};

const createUser = async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;

    if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || 'user', phone, address, isVerified: true });

    res.status(201).json({ message: 'User created', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

const updateUserStatus = async (req, res) => {
    const { isBlocked } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = isBlocked;
    await user.save();
    res.json({ message: "User status updated", user: { id: user._id, isBlocked: user.isBlocked } });
};

const updateUser = async (req, res) => {
    const { name, email, role, phone, address, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = typeof name !== 'undefined' ? name : user.name;
    user.email = typeof email !== 'undefined' ? email : user.email;
    if (typeof role !== 'undefined') user.role = role;
    user.phone = typeof phone !== 'undefined' ? phone : user.phone;
    user.address = typeof address !== 'undefined' ? address : user.address;
    if (password) {
        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
    }

    await user.save();
    res.json({ message: 'User updated', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent admin from deleting their own account
    if (req.user && req.user._id && req.user._id.toString() === req.params.id) {
        return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
};

module.exports = { getUsers, createUser, updateUserStatus, updateUser, deleteUser };