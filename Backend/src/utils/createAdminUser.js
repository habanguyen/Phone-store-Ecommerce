const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Ha12062004@';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin user already exists: ${adminEmail}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      name: 'Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      phone: '0123456789',
      address: 'Hanoi, Vietnam',
      isVerified: true
    });

    console.log(`Default admin user created: ${adminEmail}`);
  } catch (error) {
    console.error('Failed to create admin user:', error.message || error);
  }
};

module.exports = createAdminUser;
