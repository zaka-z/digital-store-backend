const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// گرفتن همه محصولات
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    res.status(500).json({ message: 'خطا در گرفتن محصولات' });
  }
});

// افزودن محصول جدید
router.post('/', async (req, res) => {
  try {
    const { name, price, description, fileUrl } = req.body;
    const product = new Product({ name, price, description, fileUrl });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.error('❌ Error adding product:', err.message);
    res.status(500).json({ message: 'خطا در افزودن محصول' });
  }
});

module.exports = router;