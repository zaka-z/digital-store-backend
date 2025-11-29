const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// گرفتن پروفایل کاربر
router.get('/', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // حذف رمز عبور
    if (!user) return res.status(404).json({ message: '❌ کاربر یافت نشد' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در گرفتن پروفایل', error: err.message });
  }
});

// ویرایش پروفایل کاربر
router.put('/', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const update = { ...req.body };

    // اگر رمز جدید فرستاده شده، هش کن
    if (update.password && update.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
    } else {
      delete update.password;
    }

    // فقط فیلدهای مجاز
    const allowedFields = ['username', 'firstName', 'lastName', 'address', 'phone1', 'phone2', 'email', 'password'];
    Object.keys(update).forEach((key) => {
      if (!allowedFields.includes(key)) delete update[key];
    });

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: '❌ کاربر یافت نشد' });

    res.json({ message: '✅ پروفایل به‌روزرسانی شد', user });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در ویرایش پروفایل', error: err.message });
  }
});

// حذف حساب کاربری
router.delete('/', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: '❌ کاربر یافت نشد' });
    res.json({ message: '🗑️ حساب کاربری حذف شد' });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در حذف حساب', error: err.message });
  }
});

module.exports = router;