const Product = require('../models/Product');

// گرفتن همه محصولات
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: '❌ خطا در دریافت محصولات', details: err.message });
  }
};

// افزودن محصول جدید
exports.addProduct = async (req, res) => {
  try {
    const { name, price, description, fileUrl, category, stock } = req.body;

    // اعتبارسنجی ساده
    if (!name || !price || !description || !fileUrl) {
      return res.status(400).json({ error: 'نام، قیمت، توضیحات و فایل الزامی هستند' });
    }

    const product = new Product({
      name,
      price,
      description,
      fileUrl,
      category,
      stock
    });

    await product.save();
    res.status(201).json({ message: '✅ محصول با موفقیت اضافه شد', product });
  } catch (err) {
    res.status(500).json({ error: '❌ خطا در افزودن محصول', details: err.message });
  }
};