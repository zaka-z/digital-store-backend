const express = require('express');
const Product = require('../models/productModel');
const router = express.Router();

// لیست محصولات
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// افزودن محصول
router.post('/', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

module.exports = router;