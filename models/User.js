const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 50 },
    password: { type: String, required: true, minlength: 6 },
    license: { type: String, enum: ['user', 'admin', 'owner'], default: 'user' },

    // اطلاعات پروفایل
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    phone1: { type: String, match: /^[0-9]{10,15}$/ }, // شماره تلفن معتبر
    phone2: { type: String },

    lastLogin: { type: Date }
  },
  {
    timestamps: true, // ایجاد خودکار createdAt و updatedAt
    versionKey: false
  }
);

// ایندکس‌ها
userSchema.index({ username: 1 });
userSchema.index({ license: 1 });

// هش کردن رمز قبل از ذخیره
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// هش کردن رمز در findOneAndUpdate
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }
  next();
});

// مقایسه رمز
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// حذف رمز از خروجی JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);