const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, password, firstName, lastName, phone1, phone2, address } = req.body;

    // بررسی وجود کاربر
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // هش کردن رمز
    const hashed = await bcrypt.hash(password, 10);

    // ساخت کاربر جدید
    const user = new User({
      username,
      password: hashed,
      firstName,
      lastName,
      phone1,
      phone2,
      address
    });

    await user.save();

    res.status(201).json({ message: '✅ User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Registration failed', details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // پیدا کردن کاربر
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    // بررسی رمز
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // تولید توکن
    const token = jwt.sign({ id: user._id, license: user.license }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // پاسخ همراه با اطلاعات کاربر
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        license: user.license,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    res.status(500).json({ error: '❌ Login failed', details: err.message });
  }
};