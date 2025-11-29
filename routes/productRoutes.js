// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// گرفتن همه محصولات (user, admin, owner)
router.get('/', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'خطا در گرفتن محصولات', error: err.message });
  }
});

// گرفتن یک محصول خاص (user, admin, owner)
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
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
    if (!user.firstName || !user.lastName || !user.address || !user.phone1) {
      return res.status(400).json({ message: 'لطفاً ابتدا اطلاعات پروفایل را تکمیل فرمایید' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'محصول یافت نشد' });

    // ورودی‌های انتخابی از فرانت
    const quantity = Number(req.body.quantity) > 0 ? Number(req.body.quantity) : 1;
    const paymentMethod = ['cash', 'card', 'online'].includes(req.body.paymentMethod)
      ? req.body.paymentMethod
      : 'online';
    const note = typeof req.body.note === 'string' ? req.body.note : '';

    // تولید شناسه خرید یکتا
    const purchaseId = uuidv4();

    // ساخت سفارش کامل مطابق مدل Order
    const order = new Order({
      userId: user._id,
      productId: product._id,
      purchaseId,
      quantity,
      totalPrice: product.price * quantity,

      status: 'pending',

      // اطلاعات کاربر در زمان خرید (immutable snapshot)
      buyerFirstName: user.firstName,
      buyerLastName: user.lastName,
      buyerEmail: user.email || '',

      deliveryAddress: user.address,
      contactPhone: user.phone1,
      contactPhone2: user.phone2 || '',

      paymentMethod,
      note
    });

    await order.save();

    res.json({
      message: `🛒 خرید محصول ${product.name} انجام شد`,
      purchaseId,
      orderId: order._id
    });
  } catch (err) {
    console.error('❌ Error in /api/products/buy/:id:', err);
    res.status(500).json({ message: 'خطا در خرید محصول', error: err.message });
  }
});

// افزودن محصول (admin و owner)
router.post('/', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { name, price, description, fileUrl } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'نام محصول الزامی است' });
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: 'قیمت معتبر نیست' });
    }

    const product = new Product({
      name: name.trim(),
      price: numericPrice,
      description: (description || '').trim(),
      fileUrl: (fileUrl || '').trim()
    });

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

    const update = {};
    if (name) update.name = name.trim();
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: 'قیمت معتبر نیست' });
      }
      update.price = numericPrice;
    }
    if (description !== undefined) update.description = description.trim();
    if (fileUrl !== undefined) update.fileUrl = fileUrl.trim();

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
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