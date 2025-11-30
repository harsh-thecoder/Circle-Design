import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function Wishlist({ openProductModal }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch wishlist with product details
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          created_at,
          products:product_id (
            id,
            name,
            price,
            image_url,
            average_rating,
            review_count
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out items where product was deleted
      const validItems = data.filter(item => item.products !== null);
      setWishlistItems(validItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      setWishlistItems(wishlistItems.filter(item => item.id !== wishlistId));
      alert('✅ Removed from wishlist');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="wishlist-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1>❤️ My Wishlist</h1>
        <p>Products you've saved for later</p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="empty-wishlist">
          <div className="empty-icon">💔</div>
          <h2>Your wishlist is empty</h2>
          <p>Start adding products you love!</p>
          <button 
            className="browse-btn"
            onClick={() => navigate('/')}
          >
            Browse Products
          </button>
        </div>
      ) : (
        <>
          <div className="wishlist-count">
            <span>{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved</span>
          </div>

          <div className="wishlist-grid">
            {wishlistItems.map((item) => (
              <div key={item.id} className="wishlist-card">
                <button 
                  className="remove-wishlist-btn"
                  onClick={() => removeFromWishlist(item.id)}
                  title="Remove from wishlist"
                >
                  ❌
                </button>

                <div 
                  className="wishlist-image-container"
                  onClick={() => openProductModal(item.products.id)}
                >
                  <img 
                    src={item.products.image_url} 
                    alt={item.products.name}
                    className="wishlist-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x240?text=No+Image';
                    }}
                  />
                  <div className="wishlist-overlay">
                    <span>👁️ View Details</span>
                  </div>
                </div>

                <div className="wishlist-info">
                  <h3>{item.products.name}</h3>
                  <div className="wishlist-price">₹{parseFloat(item.products.price).toFixed(2)}</div>
                  
                  {item.products.average_rating > 0 && (
                    <div className="wishlist-rating">
                      <span className="rating-stars">⭐ {item.products.average_rating.toFixed(1)}</span>
                      <span className="rating-count">({item.products.review_count})</span>
                    </div>
                  )}

                  <p className="saved-date">
                    Saved {new Date(item.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
