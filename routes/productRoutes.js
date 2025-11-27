// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// گرفتن همه محصولات (همه نقش‌ها)
router.get('/', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'خطا در گرفتن محصولات', error: err.message });
  }
});

// گرفتن یک محصول خاص
router.get('/:id', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'محصول یافت نشد' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'خطا در گرفتن محصول', error: err.message });
  }
});

// خرید محصول (فقط user و admin)
router.post('/buy/:id', authMiddleware(['user', 'admin']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // بررسی کامل بودن پروفایل
    if (!user.firstName || !user.lastName || !user.address || !user.phone1) {
      return res.status(400).json({ message: 'لطفاً ابتدا اطلاعات پروفایل را تکمیل فرمایید' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'محصول یافت نشد' });

    const purchaseId = uuidv4();
    const order = new Order({ userId: user._id, productId: product._id, purchaseId });
    await order.save();

    res.json({ message: `🛒 خرید محصول ${product.name} انجام شد`, purchaseId });
  } catch (err) {
    res.status(500).json({ message: 'خطا در خرید محصول', error: err.message });
  }
});

// افزودن محصول (admin و owner)
router.post('/', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { name, price, description, fileUrl } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'نام و قیمت محصول الزامی هستند' });
    }

    const product = new Product({ name, price, description, fileUrl });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'خطا در افزودن محصول', error: err.message });
  }
});

// ویرایش محصول (admin و owner)
router.put('/:id', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { name, price, description, fileUrl } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, fileUrl },
      { new: true }
    );
    if (!product) return res.status(404).json({ message: 'محصول یافت نشد' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'خطا در ویرایش محصول', error: err.message });
  }
});

// حذف محصول (admin و owner)
router.delete('/:id', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'محصول یافت نشد' });
    res.json({ message: '🗑️ محصول حذف شد' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در حذف محصول', error: err.message });
  }
});

module.exports = router;