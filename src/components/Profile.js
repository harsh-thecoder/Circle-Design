// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myProducts, setMyProducts] = useState([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      setProfile(profileData);

      // Get user's products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      
      setMyProducts(products || []);

      // Calculate stats
      const totalViews = products?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
      setStats({
        totalProducts: products?.length || 0,
        totalViews: totalViews
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId, imageUrl) => {
    if (!window.confirm('Delete this product? This action cannot be undone.')) return;

    try {
      // Delete image
      const filename = imageUrl.split('/').pop();
      await supabase.storage.from('product-images').remove([filename]);

      // Delete product
      await supabase.from('products').delete().eq('id', productId);

      // Update UI
      const updatedProducts = myProducts.filter(p => p.id !== productId);
      setMyProducts(updatedProducts);
      
      // Recalculate stats
      const totalViews = updatedProducts.reduce((sum, p) => sum + (p.views || 0), 0);
      setStats({
        totalProducts: updatedProducts.length,
        totalViews: totalViews
      });

      alert('✅ Product deleted successfully!');
    } catch (error) {
      alert('⚠️ Error: ' + error.message);
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 30) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          <h1>{profile?.name || 'User'}</h1>
          <p className="profile-email">📧 {user?.email}</p>
          <p className="profile-phone">📱 {profile?.phone || 'Not provided'}</p>
          <p className="profile-joined">📅 Joined {getRelativeTime(user?.created_at)}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.totalProducts}</h3>
            <p>Products Listed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-info">
            <h3>{stats.totalViews}</h3>
            <p>Total Views</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>Active</h3>
            <p>Account Status</p>
          </div>
        </div>
      </div>

      {/* My Products Section */}
      <div className="my-products-section">
        <div className="section-header">
          <h2>🛍️ My Products</h2>
          <button 
            className="add-product-btn"
            onClick={() => navigate('/sell')}
          >
            + Add New Product
          </button>
        </div>

        {myProducts.length === 0 ? (
          <div className="empty-products">
            <div className="empty-icon">📦</div>
            <h3>No products listed yet</h3>
            <p>Start selling by adding your first product!</p>
            <button 
              className="cta-btn"
              onClick={() => navigate('/sell')}
            >
              List Your First Product
            </button>
          </div>
        ) : (
          <div className="products-table">
            {myProducts.map((product) => (
              <div key={product.id} className="product-row">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="product-thumbnail"
                />
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p className="product-meta">
                    Listed {getRelativeTime(product.created_at)} • {product.views || 0} views
                  </p>
                </div>
                <div className="product-price-tag">
                  ₹{parseFloat(product.price).toFixed(2)}
                </div>
                <div className="product-actions">
                  <button 
                    className="edit-btn-small"
                    onClick={() => navigate(`/edit-product/${product.id}`)}
                    title="Edit product"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-btn-small"
                    onClick={() => handleDeleteProduct(product.id, product.image_url)}
                    title="Delete product"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
