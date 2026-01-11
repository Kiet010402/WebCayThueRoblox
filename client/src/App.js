import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Recharge from './pages/Recharge';
import History from './pages/History';
import CayThue from './pages/CayThue';
import Wallet from './pages/Wallet';
import News from './pages/News';
import Admin from './pages/Admin';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    };

    window.addEventListener('userBalanceUpdated', handleBalanceUpdate);
    return () => window.removeEventListener('userBalanceUpdated', handleBalanceUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/recharge" element={<Recharge />} />
          <Route path="/history" element={<History />} />
          <Route path="/cay-thue" element={<CayThue />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/news" element={<News />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
