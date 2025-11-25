const express = require('express');
const { getProducts, addProduct } = require('../controllers/productController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getProducts);
router.post('/', auth, addProduct);

module.exports = router;