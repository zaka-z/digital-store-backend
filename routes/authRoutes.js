const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ثبت‌نام کاربر جدید
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || password.length < 6) {
      return res.status(400).json({ message: 'نام کاربری و رمز عبور معتبر وارد کنید' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'نام کاربری قبلاً ثبت شده است' });
    }

    const newUser = new User({ username, password }); // رمز در مدل هش می‌شود
    await newUser.save();

    res.status(201).json({ message: '✅ ثبت‌نام موفق!', license: newUser.license });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در ثبت‌نام', error: err.message });
  }
});

// ورود کاربر
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'رمز عبور اشتباه است' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, username: user.username, license: user.license },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: user.toJSON()
    });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در ورود', error: err.message });
  }
});

// گرفتن اطلاعات کاربر لاگین‌شده
router.get('/me', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });
    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: 'توکن نامعتبر یا منقضی شده', error: err.message });
  }
});

// ویرایش پروفایل کاربر لاگین‌شده
router.put('/profile', authMiddleware(['user', 'admin', 'owner']), async (req, res) => {
  try {
    const { username, password, firstName, lastName, address, phone1, phone2 } = req.body;
    const update = {};

    if (username) update.username = username;
    if (firstName) update.firstName = firstName;
    if (lastName) update.lastName = lastName;
    if (address) update.address = address;
    if (phone1) update.phone1 = phone1;
    if (phone2) update.phone2 = phone2;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });

    res.status(200).json({ message: '✅ پروفایل به‌روزرسانی شد', user });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در ویرایش پروفایل', error: err.message });
  }
});

// تغییر نقش کاربر (فقط owner مجاز است)
router.put('/role/:id', authMiddleware(['owner']), async (req, res) => {
  try {
    const { license } = req.body;
    if (!['user', 'admin', 'owner'].includes(license)) {
      return res.status(400).json({ message: 'نقش نامعتبر است' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { license },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });

    res.status(200).json({ message: '✅ نقش کاربر تغییر کرد', user });
  } catch (err) {
    res.status(500).json({ message: '❌ خطا در تغییر نقش', error: err.message });
  }
});

// خروج کاربر
router.post('/logout', (req, res) => {
  res.status(200).json({ message: '✅ خروج موفق! لطفاً توکن را از کلاینت پاک کنید' });
});

module.exports = router;