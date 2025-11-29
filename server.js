const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// اتصال به دیتابیس
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// مسیرها
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// قابلیت‌های جدید
const cartRoutes = require('./routes/cartRoutes');   // مدیریت سبد خرید
const profileRoutes = require('./routes/profileRoutes'); // مدیریت پروفایل کاربر

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// مسیرهای جدید
app.use('/api/cart', cartRoutes);
app.use('/api/profile', profileRoutes);

// مسیر ریشه
app.get('/', (req, res) => {
  res.send('✅ Digital Store Backend is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));