const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      // گرفتن توکن از هدر یا کوکی
      const authHeader = req.headers.authorization || req.headers['x-access-token'];
      if (!authHeader) {
        return res.status(401).json({ message: '⛔ توکن وجود ندارد' });
      }

      const token = authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

      // بررسی و decode توکن
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: '⛔ توکن منقضی شده است' });
        }
        return res.status(401).json({ message: '⛔ توکن نامعتبر است', error: err.message });
      }

      // پیدا کردن کاربر
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: '⛔ کاربر یافت نشد' });
      }

      // بررسی نقش‌ها
      if (roles.length && !roles.includes(user.license)) {
        return res.status(403).json({ message: '⛔ دسترسی غیرمجاز' });
      }

      // ذخیره اطلاعات کاربر در req.user
      req.user = {
        id: user._id,
        username: user.username,
        license: user.license,
        email: user.email,
      };

      next();
    } catch (err) {
      res.status(500).json({ message: '❌ خطا در احراز هویت', error: err.message });
    }
  };
};

module.exports = authMiddleware;