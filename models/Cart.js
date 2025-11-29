const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cartNumber: { type: Number, enum: [1, 2], required: true }, // سبد ۱ یا ۲
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, default: 1, min: 1, max: 100 },
      priceAtPurchase: { type: Number } // اختیاری: ذخیره قیمت در زمان خرید
    }
  ]
}, { timestamps: true });

// هر کاربر فقط یک سبد با شماره مشخص داشته باشد
cartSchema.index({ userId: 1, cartNumber: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);