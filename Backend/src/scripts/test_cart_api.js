const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user.model');

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

async function testCartApi() {
  try {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOne({ email: '20222180@eaut.edu.vn' });
    if (!user) {
      console.log('User not found.');
      return;
    }

    // Sign a token just like generateToken(user) does in the backend
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    console.log('Generated token for user:', user._id);

    // Call the local backend API /api/cart
    console.log('Fetching cart from local API...');
    const res = await fetch('http://localhost:5000/api/cart', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('Response body:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testCartApi();
