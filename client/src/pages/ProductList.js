import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ProductList.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Demo data nếu backend không chạy
        setProducts([
          {
            _id: '1',
            name: 'Starter Account',
            description: 'Acc mới, level 1',
            price: 50000,
            category: 'Beginner',
            inStock: true
          },
          {
            _id: '2',
            name: 'Premium Account',
            description: 'Acc có items, level 10',
            price: 150000,
            category: 'Premium',
            inStock: true
          }
        ]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = filter === 'all' ? products : products.filter(p => p.category === filter);

  if (loading) return <div className="loading">Đang tải sản phẩm...</div>;

  return (
    <div className="product-list">
      <h1>🎮 DANH SÁCH NICK ROBLOX</h1>
      
      <div className="filter-section">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất Cả
        </button>
        <button 
          className={`filter-btn ${filter === 'Beginner' ? 'active' : ''}`}
          onClick={() => setFilter('Beginner')}
        >
          Beginner
        </button>
        <button 
          className={`filter-btn ${filter === 'Premium' ? 'active' : ''}`}
          onClick={() => setFilter('Premium')}
        >
          Premium
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <p className="no-products">Không có sản phẩm nào</p>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <Link key={product._id} to={`/product/${product._id}`} className="product-card">
              <div className="product-image">
                <div className="placeholder">🎮</div>
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="category">{product.category || 'General'}</p>
                <p className="description">{product.description}</p>
                <p className="price">{product.price.toLocaleString('vi-VN')} đ</p>
                <p className="stock">
                  {product.inStock ? '✅ Còn Hàng' : '❌ Hết Hàng'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;
