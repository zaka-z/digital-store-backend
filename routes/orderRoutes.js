// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// گرفتن همه سفارش‌ها با اطلاعات کامل کاربر (بدون رمز عبور)
router.get('/', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'username license firstName lastName address phone1 phone2 createdAt lastLogin')
      .populate('productId', 'name price description');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'خطا در گرفتن سفارش‌ها', error: err.message });
  }
});

// تغییر وضعیت سفارش به پردازش‌شده
router.put('/:id/status', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { status } = req.body; // انتظار: 'processed'
    const allowed = ['pending', 'processed', 'paid', 'shipped', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'وضعیت نامعتبر است' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('userId', 'username license firstName lastName address phone1 phone2 createdAt lastLogin')
      .populate('productId', 'name price description');

    if (!order) return res.status(404).json({ message: 'سفارش یافت نشد' });
    res.json({ message: 'وضعیت سفارش به‌روزرسانی شد', order });
  } catch (err) {
    res.status(500).json({ message: 'خطا در تغییر وضعیت سفارش', error: err.message });
  }
});

module.exports = router;