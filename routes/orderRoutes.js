const express = require('express');
const cors = require('cors');
const router = express.Router();

const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// فعال‌سازی CORS برای همه مسیرهای این روتر (کمک به preflight در هاست‌هایی مثل Render)
router.use(cors());

// ابزارهای کمکی: صفحه‌بندی و مرتب‌سازی امن
const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// فقط فیلدهای مجاز برای sort
const ALLOWED_SORTS = ['createdAt', 'totalPrice', 'status', 'purchaseId'];
const parseSort = (req) => {
  const sortBy = req.query.sortBy;
  const order = req.query.order === 'asc' ? 1 : -1;
  if (sortBy && ALLOWED_SORTS.includes(sortBy)) {
    return { [sortBy]: order };
  }
  return { createdAt: -1 };
};

// گرفتن همه سفارش‌ها (admin و owner) با صفحه‌بندی و مرتب‌سازی
router.get('/', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req);

    const [orders, total] = await Promise.all([
      Order.find({})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username license firstName lastName address phone1 phone2 createdAt lastLogin')
        // اگر مدل Order از items چندمحصولی استفاده می‌کند، این خط را نگه دار
        .populate('items.productId', 'name price description'),
      Order.countDocuments({})
    ]);

    res.status(200).json({
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در گرفتن سفارش‌ها', error: err.message });
  }
});

// گرفتن سفارش‌های کاربر جاری (user, admin, owner) با صفحه‌بندی
router.get('/my', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const sort = parseSort(req);

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user.id })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        // اگر مدل تک‌محصولی دارید، این را تنظیم کنید:
        .populate('items.productId', 'name price description'),
      Order.countDocuments({ userId: req.user.id })
    ]);

    res.status(200).json({
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در گرفتن سفارش‌های شما', error: err.message });
  }
});

// گرفتن جزئیات یک سفارش خاص
router.get('/:id', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'username license firstName lastName address phone1 phone2 createdAt lastLogin')
      .populate('items.productId', 'name price description');

    if (!order) {
      return res.status(404).json({ message: '❌ سفارش یافت نشد' });
    }

    // کنترل دسترسی: کاربر تنها سفارش خودش را می‌بیند
    if (req.user.license === 'user' && order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: '⛔ دسترسی غیرمجاز' });
    }

    res.status(200).json(order);
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
      .populate('items.productId', 'name price description');

    if (!order) {
      return res.status(404).json({ message: '❌ سفارش یافت نشد' });
    }

    res.status(200).json({ message: '✅ وضعیت سفارش به‌روزرسانی شد', order });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در تغییر وضعیت سفارش', error: err.message });
  }
});

// حذف سفارش (admin و owner)
router.delete('/:id', authMiddleware(['admin', 'owner']), async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '❌ سفارش یافت نشد' });
    }
    res.status(200).json({ message: '🗑️ سفارش حذف شد' });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در حذف سفارش', error: err.message });
  }
});

module.exports = router;