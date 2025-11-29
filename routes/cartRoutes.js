const express = require('express');
const cors = require('cors');
const router = express.Router();

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// فعال‌سازی CORS برای همه مسیرهای این router
router.use(cors());

// گرفتن سبد خرید کاربر
router.get('/:cartNumber', authMiddleware(['user']), async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id, cartNumber: req.params.cartNumber })
      .populate('items.productId', 'name price');
    res.status(200).json(cart || { items: [] });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در دریافت سبد', error: err.message });
  }
});

// افزودن محصول به سبد
router.post('/:cartNumber/add', authMiddleware(['user']), async (req, res) => {
  try {
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
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در افزودن محصول به سبد', error: err.message });
  }
});

// ثبت سفارش از یک سبد
router.post('/:cartNumber/checkout', authMiddleware(['user']), async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id, cartNumber: req.params.cartNumber })
      .populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'سبد خالی است' });
    }

    const purchaseId = `ORD-${Date.now()}`;
    const totalPrice = cart.items.reduce((sum, i) => sum + i.productId.price * i.quantity, 0);

    // ذخیره همه محصولات در سفارش
    const order = new Order({
      userId: req.user.id,
      items: cart.items.map(i => ({
        productId: i.productId._id,
        quantity: i.quantity,
        priceAtPurchase: i.productId.price
      })),
      purchaseId,
      totalPrice,
      deliveryAddress: req.user.address,
      contactPhone: req.user.phone1,
      status: 'pending'
    });

    await order.save();
    cart.items = []; // خالی کردن سبد پس از ثبت سفارش
    await cart.save();

    res.status(201).json({ message: '✅ سفارش ثبت شد', purchaseId });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در ثبت سفارش', error: err.message });
  }
});

module.exports = router;