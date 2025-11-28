// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// گرفتن همه سفارش‌ها (فقط admin و owner)
router.get('/', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'username firstName lastName phone1')
      .populate('productId', 'name price');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'خطا در گرفتن سفارش‌ها', error: err.message });
  }
});

module.exports = router;