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
import Chat from './components/Chat';
import api from './api/axios';

function AppContent({ setUser, user }) {
  const location = useLocation();

    // Fetch balance from API when route changes (debounced to avoid too many requests)
  useEffect(() => {
    const fetchUserBalance = async () => {
      if (!user) return; // Only fetch if user is logged in

      try {
        const response = await api.get('/api/users/me');
        const updatedUser = {
          id: response.data.id,
          username: response.data.username,
          balance: response.data.balance || 0,
          role: response.data.role || 'user'
        };
        // Don't store user in localStorage for security
        setUser(updatedUser);
      } catch (error) {
        // If token is invalid, clear user
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      }
    };

    // Debounce to avoid fetching on every tiny route change
    const timer = setTimeout(() => {
      fetchUserBalance();
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname, setUser, user]);

  return null;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user was logged out (don't auto-fetch if logged out)
    const wasLoggedOut = sessionStorage.getItem('loggedOut') === 'true';
    if (wasLoggedOut) {
      sessionStorage.removeItem('loggedOut');
      setUser(null);
      return;
    }

    // Fetch fresh user info from API (token is in httpOnly cookie)
    api.get('/api/users/me')
    .then(response => {
      const updatedUser = {
        id: response.data.id,
        username: response.data.username,
        balance: response.data.balance || 0,
        role: response.data.role || 'user'
      };
      // Don't store user in localStorage for security
      setUser(updatedUser);
    })
    .catch(error => {
      // If token is invalid, clear user
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      }
    });
    
    // Listen for logout event
    const handleLogout = () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.setItem('loggedOut', 'true');
      setUser(null);
    };
    window.addEventListener('userLoggedOut', handleLogout);

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      // Fetch fresh balance when event is triggered
      api.get('/api/users/me')
      .then(response => {
        const updatedUser = {
          id: response.data.id,
          username: response.data.username,
          balance: response.data.balance || 0,
          role: response.data.role || 'user'
        };
        // Don't store user in localStorage for security
        setUser(updatedUser);
      })
      .catch(() => {
        // Ignore errors on event-based updates
      });
    };

    window.addEventListener('userBalanceUpdated', handleBalanceUpdate);
    
    // Also refresh balance when user focuses the window/tab (e.g., after admin approves recharge)
    const handleFocus = () => {
      // Fetch fresh user info when window focuses (don't store in localStorage)
      api.get('/api/users/me')
      .then(response => {
        const updatedUser = {
          id: response.data.id,
          username: response.data.username,
          balance: response.data.balance || 0,
          role: response.data.role || 'user'
        };
        // Don't store user in localStorage for security
        setUser(updatedUser);
      })
      .catch(() => {
        // Ignore errors on focus-based updates
      });
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
      window.removeEventListener('userBalanceUpdated', handleBalanceUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API to invalidate session and clear cookie
      await api.post('/api/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    }
    
    // Clear any remaining localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.setItem('loggedOut', 'true');
    
    // Update state
    setUser(null);
    
    // Dispatch logout event
    window.dispatchEvent(new Event('userLoggedOut'));
  };

  return (
    <HashRouter>
      <AppContent setUser={setUser} user={user} />
      <Navbar user={user} onLogout={handleLogout} />
      <Chat user={user} />
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
