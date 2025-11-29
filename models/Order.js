const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // اگر سفارش چند محصولی باشه
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1, max: 100 },
        priceAtPurchase: { type: Number, required: true }
      }
    ],

    purchaseId: { type: String, required: true, unique: true },

    // قیمت نهایی سفارش
    totalPrice: { type: Number, required: true, min: 0 },

    // وضعیت سفارش
    status: {
      type: String,
      enum: ['pending', 'processed', 'paid', 'shipped', 'cancelled'],
      default: 'pending'
    },

    // اطلاعات کاربر در زمان خرید
    buyerFirstName: { type: String, required: true },
    buyerLastName: { type: String, required: true },
    buyerEmail: { type: String },
    deliveryAddress: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactPhone2: { type: String },

    // روش پرداخت
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
      default: 'online'
    },

    // وضعیت پرداخت (اختیاری برای آینده)
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed'],
      default: 'unpaid'
    },

    transactionId: { type: String }, // اختیاری: برای پرداخت آنلاین

    // یادداشت یا توضیحات سفارش
    note: { type: String }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// ایندکس‌ها
orderSchema.index({ userId: 1, purchaseId: 1 });

module.exports = mongoose.model('Order', orderSchema);