import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import supabase from './supabaseClient';
import Auth from './components/Auth';
import Home from './components/Home';
import Sell from './components/Sell';
import ProductModal from './components/ProductModal';
import ProtectedRoute from './components/ProtectedRoute';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import EditProduct from './components/EditProduct';
import Wishlist from './components/Wishlist';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading...</p>
    </div>
  );

  return (
    <BrowserRouter>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <div className="nav-brand">
              <Link to="/">🛍️ Mini Marketplace</Link>
            </div>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              {user ? (
                <>
                  <Link to="/wishlist" className="nav-link">❤️ Wishlist</Link>
                  <Link to="/profile" className="nav-link">👤 Profile</Link>
                  <Link to="/sell" className="nav-link sell-link">+ Sell Product</Link>
                  <div className="user-info">
                    <span className="welcome-text">👋 {user.user_metadata?.name || user.email}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="login-link">Login / Sign Up</Link>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home openProductModal={setSelectedProduct} />} />
          
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Auth setUser={setUser} />} 
          />
          
          <Route
            path="/sell"
            element={
              <ProtectedRoute user={user}>
                <Sell user={user} />
              </ProtectedRoute>
            }
          />
          
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-product/:id"
            element={
              <ProtectedRoute user={user}>
                <EditProduct />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute user={user}>
                <Wishlist openProductModal={setSelectedProduct} />
              </ProtectedRoute>
            }
          />

          <Route
          path="/edit-product/:id"
          element={
            <ProtectedRoute user={user}>
              <EditProduct />
            </ProtectedRoute>
          }
        />


        </Routes>

        {selectedProduct && (
          <ProductModal 
            productId={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
