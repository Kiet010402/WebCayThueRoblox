import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductDetail.css';

function ProductDetail() {
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    alert('Chức năng giỏ hàng đã được gỡ bỏ. Vui lòng liên hệ admin để đặt hàng.');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        <div className="product-image-section">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className="placeholder">No Image Available</div>
          )}
        </div>

        <div className="product-details-section">
          <h1>{product.name}</h1>
          <p className="category">{product.category || 'General'}</p>
          <p className="description">{product.description || 'No description available'}</p>

          <div className="price-section">
            <span className="price">${product.price}</span>
            <span className={`stock ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="quantity-section">
            <label>Quantity:</label>
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
          </div>

          <button 
            className="add-to-cart-btn" 
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>

          <button className="back-btn" onClick={() => navigate('/')}>
            Back to Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
