const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔑 ثبت‌نام کاربر جدید
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // بررسی تکراری بودن نام کاربری
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'نام کاربری قبلاً ثبت شده است' });
    }

    // ساخت کاربر جدید (رمز عبور به صورت خودکار در pre('save') هش می‌شود)
    const newUser = new User({ username, password });
    await newUser.save();

    res.json({ message: 'ثبت‌نام موفق!' });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت‌نام', error: err.message });
  }
});

// 🔑 ورود کاربر
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'کاربر یافت نشد' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'رمز عبور اشتباه است' });
    }

    // تولید توکن JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ورود', error: err.message });
  }
});

// 🧑 مسیر گرفتن اطلاعات کاربر لاگین‌شده
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'توکن وجود ندارد' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password'); // رمز عبور حذف شود
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'توکن نامعتبر است', error: err.message });
  }
});

module.exports = router;