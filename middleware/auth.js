// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'توکن وجود ندارد' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'کاربر یافت نشد' });
      }

      // بررسی نقش
      if (roles.length && !roles.includes(user.license)) {
        return res.status(403).json({ message: 'دسترسی غیرمجاز' });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ message: 'توکن نامعتبر است', error: err.message });
    }
  };
};

module.exports = authMiddleware;