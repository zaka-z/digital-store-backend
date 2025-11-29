const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * authMiddleware(roles)
 * roles: آرایه‌ای از نقش‌های مجاز ['user','admin','owner'] یا خالی برای آزاد بودن
 */
const authMiddleware = (roles = []) => {
  // اطمینان از آرایه بودن roles
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return async (req, res, next) => {
    try {
      // اجازه عبور preflight برای CORS
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }

      // بررسی وجود JWT_SECRET
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: '❌ تنظیم JWT_SECRET در محیط سرور الزامی است' });
      }

      // دریافت توکن از Authorization, x-access-token یا کوکی‌ها
      const authHeader = req.headers.authorization || req.headers['x-access-token'];
      const cookieToken =
        (req.cookies && (req.cookies.token || req.cookies.jwt)) ||
        (req.signedCookies && (req.signedCookies.token || req.signedCookies.jwt));

      let token;
      if (authHeader) {
        token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      } else if (cookieToken) {
        token = cookieToken;
      }

      if (!token) {
        return res.status(401).json({ message: '⛔ توکن وجود ندارد' });
      }

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

      // بررسی نقش‌ها (در صورت نیاز)
      if (allowedRoles.length && !allowedRoles.includes(user.license)) {
        return res.status(403).json({ message: '⛔ دسترسی غیرمجاز' });
      }

      // ذخیره اطلاعات ضروری کاربر روی req.user
      req.user = {
        id: user._id.toString(),
        username: user.username,
        license: user.license,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        address: user.address || '',
        phone1: user.phone1 || '',
        phone2: user.phone2 || ''
      };

      next();
    } catch (err) {
      res.status(500).json({ message: '❌ خطا در احراز هویت', error: err.message });
    }
  };
};

module.exports = authMiddleware;