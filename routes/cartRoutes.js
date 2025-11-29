const express = require('express');
const cors = require('cors');
const router = express.Router();

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// پاسخ به preflight برای checkout
router.options('/:cartNumber/checkout', cors());

// گرفتن سبد خرید کاربر
router.get('/:cartNumber', authMiddleware(['user']), async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id, cartNumber: req.params.cartNumber })
    .populate('items.productId', 'name price');
  res.json(cart || { items: [] });
});

// افزودن محصول به سبد
router.post('/:cartNumber/add', authMiddleware(['user']), async (req, res) => {
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ userId: req.user.id, cartNumber: req.params.cartNumber });
  if (!cart) cart = new Cart({ userId: req.user.id, cartNumber: req.params.cartNumber, items: [] });

  const existing = cart.items.find(i => i.productId.toString() === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  await cart.save();
  res.json(cart);
});

// ثبت سفارش از یک سبد
router.post('/:cartNumber/checkout', authMiddleware(['user']), async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id, cartNumber: req.params.cartNumber })
    .populate('items.productId');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ message: 'سبد خالی است' });
  }

  const purchaseId = `ORD-${Date.now()}`;
  const totalPrice = cart.items.reduce((sum, i) => sum + i.productId.price * i.quantity, 0);

  const order = new Order({
    userId: req.user.id,
    productId: cart.items[0].productId._id, // یا ذخیره همه محصولات در آرایه
    purchaseId,
    quantity: cart.items[0].quantity,
    totalPrice,
    deliveryAddress: req.user.address,
    contactPhone: req.user.phone1,
    status: 'pending'
  });

  await order.save();
  cart.items = []; // خالی کردن سبد پس از ثبت سفارش
  await cart.save();

  res.json({ message: '✅ سفارش ثبت شد', purchaseId });
});

module.exports = router;