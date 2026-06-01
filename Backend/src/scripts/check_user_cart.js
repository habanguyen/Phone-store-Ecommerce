const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Cart = require('../models/cart.model');

const MONGO_URI = process.env.MONGO_URI;

async function checkCart() {
  try {
    console.log('Connecting to MONGO_URI:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('--- MongoDB Connected ---');
    const user = await User.findOne({ email: '20222180@eaut.edu.vn' });
    if (!user) {
      console.log('User 20222180@eaut.edu.vn not found in database.');
      return;
    }
    console.log('User found:', {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    const cart = await Cart.findOne({ user: user._id }).populate('items.product');
    console.log('Cart:', JSON.stringify(cart, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkCart();
