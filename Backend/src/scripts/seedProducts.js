const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Product = require('../models/product.model');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');
const User = require('../models/user.model');
const Coupon = require('../models/coupon.model');
const Cart = require('../models/cart.model');
const Order = require('../models/order.model');
const Review = require('../models/review.model');
const createAdminUser = require('../utils/createAdminUser');

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cellphone_store';
const dataFile = path.resolve(__dirname, '../data/sample_products_mongo.json');

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeBrand = async (brandName) => {
  if (!brandName) return null;
  const name = brandName.toString().trim();
  if (!name) return null;

  const slug = slugify(name);
  let brand = await Brand.findOne({ slug });
  if (!brand) {
    brand = await Brand.create({ name, slug });
  }
  return brand;
};

const normalizeCategory = async (categoryName) => {
  if (!categoryName) return null;
  const name = categoryName.toString().trim();
  if (!name) return null;

  const slug = slugify(name);
  let category = await Category.findOne({ slug });
  if (!category) {
    category = await Category.create({ name, slug });
  }
  return category;
};

const formatProduct = async (product) => {
  const brandDoc = await normalizeBrand(product.brand);
  const categoryDoc = await normalizeCategory(product.category);

  return {
    name: product.name,
    slug: product.slug || slugify(product.name || ''),
    brand: product.brand,
    category: product.category,
    brandRef: brandDoc ? brandDoc._id : null,
    categoryRef: categoryDoc ? categoryDoc._id : null,
    description: product.description,
    base_price: product.base_price,
    sale_price: product.sale_price,
    thumbnail: product.thumbnail,
    images: [
      product.thumbnail,
      ...(product.variants?.flatMap((v) => v.images || []) || [])
    ].filter(Boolean),
    dimensions: product.dimensions,
    design_features: product.design_features,
    material: product.material,
    specifications: product.specifications,
    variants: (product.variants || []).map((variant) => ({
      sku: variant.sku,
      storage: variant.storage,
      color_name: variant.color_name,
      color_code: variant.color_code,
      size: variant.storage,
      color: variant.color_name,
      price: variant.price,
      stock: variant.stock,
      images: variant.images || []
    })),
    is_active: product.is_active,
    is_featured: product.is_featured,
    seo: product.seo,
    ratings: product.ratings
  };
};

const getProductPrice = (product) => product.variants?.[0]?.price || product.sale_price || product.base_price || 0;

const importData = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    const rawData = fs.readFileSync(dataFile, 'utf-8');
    const products = JSON.parse(rawData);

    for (const model of [Product, Brand, Category, User, Coupon, Cart, Order, Review]) {
      try {
        await model.collection.drop();
      } catch (dropError) {
        // ignore if the collection does not exist yet
      }
    }

    console.log('Collections dropped.');

    const formattedProducts = [];
    for (const product of products) {
      formattedProducts.push(await formatProduct(product));
    }
    const insertedProducts = await Product.insertMany(formattedProducts);

    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const userPassword = await bcrypt.hash('User@123', 10);

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      phone: '0987654321',
      address: '123 Admin Street, Hanoi',
      isVerified: true
    });

    await createAdminUser();

    const demoUser = await User.create({
      name: 'Demo Customer',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      phone: '0912345678',
      address: '456 Demo Lane, Ho Chi Minh City',
      isVerified: true
    });

    const coupons = [
      {
        code: 'SAVE10',
        type: 'percent',
        value: 10,
        minOrder: 100000,
        expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 100,
        isActive: true
      },
      {
        code: 'WELCOME100',
        type: 'fixed',
        value: 100000,
        minOrder: 200000,
        expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 50,
        isActive: true
      }
    ];

    await Coupon.insertMany(coupons);

    const firstProduct = insertedProducts[0];
    const secondProduct = insertedProducts[1] || firstProduct;

    const cartItems = [
      {
        product: firstProduct._id,
        size: firstProduct.variants?.[0]?.size || 'Standard',
        color: firstProduct.variants?.[0]?.color || 'Default',
        quantity: 1,
        price: getProductPrice(firstProduct)
      },
      {
        product: secondProduct._id,
        size: secondProduct.variants?.[0]?.size || 'Standard',
        color: secondProduct.variants?.[0]?.color || 'Default',
        quantity: 2,
        price: getProductPrice(secondProduct)
      }
    ];

    await Cart.create({
      user: demoUser._id,
      items: cartItems,
      totalPrice: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    });

    const orderItems = [
      {
        product: firstProduct._id,
        name: firstProduct.name,
        price: getProductPrice(firstProduct),
        size: firstProduct.variants?.[0]?.size || 'Standard',
        color: firstProduct.variants?.[0]?.color || 'Default',
        quantity: 1
      }
    ];

    const totalPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = 100000;

    await Order.create({
      user: demoUser._id,
      items: orderItems,
      totalPrice,
      discount,
      finalPrice: Math.max(0, totalPrice - discount),
      coupon: 'WELCOME100',
      status: 'confirmed',
      shippingAddress: demoUser.address
    });

    await Review.create({
      user: demoUser._id,
      product: firstProduct._id,
      rating: 5,
      title: 'Rất hài lòng',
      comment: 'Sản phẩm chất lượng, giao hàng nhanh và dịch vụ tốt.',
      isApproved: true
    });

    console.log('Sample users, coupons, carts, orders, and reviews created.');
    console.log('Admin:', adminUser.email, 'password: Admin@123');
    console.log('Demo user:', demoUser.email, 'password: User@123');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  }
};

importData();
