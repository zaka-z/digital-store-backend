const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 100 },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, required: true, minlength: 10, maxlength: 1000 },
  fileUrl: { type: String, required: true },

  // فیلدهای اختیاری
  category: { type: String },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// ایندکس روی نام محصول
productSchema.index({ name: 1 });

module.exports = mongoose.model('Product', productSchema);