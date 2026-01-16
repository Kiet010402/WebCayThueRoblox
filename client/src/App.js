import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import Profile from './pages/Profile';
import NickRoblox from './pages/NickRoblox';
import api from './api/axios';

function AppContent({ setUser }) {
  const location = useLocation();

  // Fetch balance from API when route changes (debounced to avoid too many requests)
  useEffect(() => {
    const fetchUserBalance = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = localStorage.getItem('user');
        if (userData) {
          const updatedUser = { ...JSON.parse(userData), balance: response.data.balance };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } catch (error) {
        // If token is invalid, clear user
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
    };

    // Debounce to avoid fetching on every tiny route change
    const timer = setTimeout(() => {
      fetchUserBalance();
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname, setUser]);

  return null;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Immediately fetch fresh balance from API
      api.get('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        const updatedUser = { ...parsedUser, balance: response.data.balance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      })
      .catch(error => {
        // If token is invalid, clear user
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      });
    }

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        // Also fetch fresh balance when event is triggered
        api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          const updatedUser = { ...JSON.parse(userData), balance: response.data.balance };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        })
        .catch(() => {
          // Ignore errors on event-based updates
        });
      }
    };

    window.addEventListener('userBalanceUpdated', handleBalanceUpdate);
    
    // Also refresh balance when user focuses the window/tab (e.g., after admin approves recharge)
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        api.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          const userData = localStorage.getItem('user');
          if (userData) {
            const updatedUser = { ...JSON.parse(userData), balance: response.data.balance };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        })
        .catch(() => {
          // Ignore errors on focus-based updates
        });
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('userBalanceUpdated', handleBalanceUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <HashRouter>
      <AppContent setUser={setUser} user={user} />
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
          <Route path="/nick-roblox" element={<NickRoblox />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/news" element={<News />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
