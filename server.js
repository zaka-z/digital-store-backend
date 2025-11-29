const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();

// ===== Middleware عمومی =====
app.use(express.json());
app.use(cookieParser());

// ===== تنظیمات دقیق CORS =====
app.use(cors({
  origin: 'http://localhost:3000', // آدرس فرانت
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

// ===== اتصال به دیتابیس =====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// ===== مسیرها =====
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/profile', profileRoutes);

// ===== مسیر ریشه =====
app.get('/', (req, res) => {
  res.send('✅ Digital Store Backend is running...');
});

// ===== مدیریت مسیرهای نامعتبر =====
app.use((req, res) => {
  res.status(404).json({ message: '❌ مسیر یافت نشد' });
});

// ===== مدیریت خطاهای داخلی =====
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ message: '❌ خطای داخلی سرور', error: err.message });
});

// ===== اجرای سرور =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));