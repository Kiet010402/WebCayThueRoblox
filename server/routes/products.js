const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getJWTSecret } = require('../utils/auth');

// Middleware to verify admin
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token không tồn tại' });
  }

  try {
    const decoded = jwt.verify(token, getJWTSecret());
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    req.userId = decoded.userId;
    req.admin = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token không hợp lệ' });
  }
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    // Return empty array if no products, not an error
    res.json(products || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    // Validate ObjectId to prevent NoSQL injection
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tải sản phẩm' });
  }
});

// Create product (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, price, image, category, inStock, quantity } = req.body;

    // Input validation
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
    }
    if (!price || isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({ message: 'Giá sản phẩm không hợp lệ' });
    }
    if (quantity !== undefined && (isNaN(quantity) || parseInt(quantity) < 0)) {
      return res.status(400).json({ message: 'Số lượng không hợp lệ' });
    }

    const product = new Product({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: parseFloat(price),
      image: image ? image.trim() : '',
      category: category ? category.trim() : '',
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      quantity: quantity !== undefined ? parseInt(quantity) : 0
    });

    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message || 'Có lỗi xảy ra khi tạo sản phẩm' });
  }
});

// Update product (admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    // Validate ObjectId to prevent NoSQL injection
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Input validation and sanitization
    if (req.body.name !== undefined) {
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ message: 'Tên sản phẩm không được để trống' });
      }
      product.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) {
      product.description = req.body.description.trim();
    }
    if (req.body.price !== undefined) {
      const price = parseFloat(req.body.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: 'Giá sản phẩm không hợp lệ' });
      }
      product.price = price;
    }
    if (req.body.image !== undefined) {
      product.image = req.body.image.trim();
    }
    if (req.body.category !== undefined) {
      product.category = req.body.category.trim();
    }
    if (req.body.inStock !== undefined) {
      product.inStock = Boolean(req.body.inStock);
    }
    if (req.body.quantity !== undefined) {
      const quantity = parseInt(req.body.quantity);
      if (isNaN(quantity) || quantity < 0) {
        return res.status(400).json({ message: 'Số lượng không hợp lệ' });
      }
      product.quantity = quantity;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: error.message || 'Có lỗi xảy ra khi cập nhật sản phẩm' });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    // Validate ObjectId to prevent NoSQL injection
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa sản phẩm' });
  }
});

module.exports = router;
