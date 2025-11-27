const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ثبت‌نام کاربر جدید
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'نام کاربری قبلاً ثبت شده است' });
    }

    const newUser = new User({ username, password }); // رمز باید در مدل هش شود
    await newUser.save();

    res.json({ message: 'ثبت‌نام موفق!', license: newUser.license });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ثبت‌نام', error: err.message });
  }
});

// ورود کاربر
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
      { id: user._id, username: user.username, license: user.license },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, license: user.license }
    });
  } catch (err) {
    res.status(500).json({ message: 'خطا در ورود', error: err.message });
  }
});

// گرفتن اطلاعات کاربر لاگین‌شده
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'توکن وجود ندارد' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'توکن منقضی یا نامعتبر است', error: err.message });
  }
});

// تغییر نقش کاربر (فقط owner مجاز است)
router.put('/role/:id', authMiddleware(['owner']), async (req, res) => {
  try {
    const { license } = req.body; // 'admin' یا 'owner'
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { license },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'کاربر یافت نشد' });

    res.json({ message: 'نقش کاربر تغییر کرد', user });
  } catch (err) {
    res.status(500).json({ message: 'خطا در تغییر نقش', error: err.message });
  }
});

module.exports = router;