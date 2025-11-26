const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/auth');

// 📦 گرفتن همه محصولات (همه نقش‌ها می‌توانند ببینند)
router.get('/', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    res.status(500).json({ message: 'خطا در گرفتن محصولات' });
  }
});

// 🛒 خرید محصول (فقط user و admin می‌توانند خرید کنند)
router.post('/buy/:id', authMiddleware(['user', 'admin']), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'محصول یافت نشد' });
    }

    // اینجا می‌تونی لاجیک سفارش رو اضافه کنی (ثبت در دیتابیس Orders)
    res.json({ message: `🛒 خرید محصول ${product.name} انجام شد` });
  } catch (err) {
    console.error('❌ Error buying product:', err.message);
    res.status(500).json({ message: 'خطا در خرید محصول' });
  }
});

// ➕ افزودن محصول جدید (فقط admin و owner می‌توانند اضافه کنند)
router.post('/add', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { name, price, description, fileUrl } = req.body;
    const product = new Product({ name, price, description, fileUrl });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('❌ Error adding product:', err.message);
    res.status(500).json({ message: 'خطا در افزودن محصول' });
  }
});

// ✏️ ویرایش محصول (فقط admin و owner)
router.put('/:id', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { name, price, description, fileUrl } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, fileUrl },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'محصول یافت نشد' });
    }
    res.json(product);
  } catch (err) {
    console.error('❌ Error updating product:', err.message);
    res.status(500).json({ message: 'خطا در ویرایش محصول' });
  }
});

// 🗑️ حذف محصول (فقط admin و owner)
router.delete('/:id', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'محصول یافت نشد' });
    }
    res.json({ message: '🗑️ محصول حذف شد' });
  } catch (err) {
    console.error('❌ Error deleting product:', err.message);
    res.status(500).json({ message: 'خطا در حذف محصول' });
  }
});

module.exports = router;