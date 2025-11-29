const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// گرفتن همه سفارش‌ها با اطلاعات کامل کاربر (admin و owner)
router.get('/', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'username license firstName lastName address phone1 phone2 createdAt lastLogin')
      .populate('productId', 'name price description');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در گرفتن سفارش‌ها', error: err.message });
  }
});

// گرفتن سفارش‌های کاربر جاری (user, admin, owner)
router.get('/my', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('productId', 'name price description');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در گرفتن سفارش‌های شما', error: err.message });
  }
});

// گرفتن جزئیات یک سفارش خاص
router.get('/:id', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'username license firstName lastName address phone1 phone2 createdAt lastLogin')
      .populate('productId', 'name price description');

    if (!order) return res.status(404).json({ message: '❌ سفارش یافت نشد' });

    // کنترل دسترسی: یوزر فقط سفارش خودش رو ببینه
    if (req.user.license === 'user' && order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: '⛔ دسترسی غیرمجاز' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در گرفتن سفارش', error: err.message });
  }
});

// تغییر وضعیت سفارش (admin و owner)
router.put('/:id/status', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'processed', 'paid', 'shipped', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: '❌ وضعیت نامعتبر است' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('userId', 'username license firstName lastName address phone1 phone2 createdAt lastLogin')
      .populate('productId', 'name price description');

    if (!order) return res.status(404).json({ message: '❌ سفارش یافت نشد' });
    res.json({ message: '✅ وضعیت سفارش به‌روزرسانی شد', order });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در تغییر وضعیت سفارش', error: err.message });
  }
});

// حذف سفارش (admin و owner)
router.delete('/:id', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: '❌ سفارش یافت نشد' });
    res.json({ message: '🗑️ سفارش حذف شد' });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در حذف سفارش', error: err.message });
  }
});

module.exports = router;