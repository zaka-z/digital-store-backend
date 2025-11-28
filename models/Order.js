// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

    purchaseId: { type: String, required: true, unique: true },

    // تعداد محصول خریداری‌شده
    quantity: { type: Number, default: 1, min: 1 },

    // قیمت نهایی سفارش (ذخیره برای گزارش‌گیری)
    totalPrice: { type: Number, required: true },

    // وضعیت سفارش
    status: {
      type: String,
      enum: ['pending', 'processed', 'paid', 'shipped', 'cancelled'],
      default: 'pending'
    },

    // اطلاعات کاربر در زمان خرید (برای جلوگیری از تغییر بعدی پروفایل)
    buyerFirstName: { type: String, required: true },
    buyerLastName: { type: String, required: true },
    buyerEmail: { type: String }, // اختیاری
    deliveryAddress: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactPhone2: { type: String }, // شماره دوم اختیاری

    // روش پرداخت
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
      default: 'online'
    },

    // یادداشت یا توضیحات سفارش
    note: { type: String }
  },
  {
    timestamps: true, // ایجاد خودکار createdAt و updatedAt
    versionKey: false
  }
);

module.exports = mongoose.model('Order', orderSchema);