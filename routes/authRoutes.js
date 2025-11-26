const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// ثبت‌نام
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'کاربر ثبت شد' });
  } catch (err) {
    console.error('❌ Register Error:', err.message);
    res.status(500).json({ message: 'خطا در ثبت‌نام' });
  }
});

// ورود
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'کاربر یافت نشد' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'رمز عبور اشتباه است' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error('❌ Login Error:', err.message);
    res.status(500).json({ message: 'خطا در ورود' });
  }
});

module.exports = router;