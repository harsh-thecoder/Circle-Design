// src/components/ProductModal.js
import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";
import ReviewSection from './ReviewSection';

// Helper function to show relative time
const getRelativeTime = (dateString) => {
  if (!dateString) return 'Recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 30) {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else if (diffInDays > 0) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
};

export default function ProductModal({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProductDetails() {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);
        
        // Fetch product first
        const { data: prod, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();

        if (prodError) throw prodError;
        setProduct(prod);

        // Then fetch seller profile separately
        if (prod && prod.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("name, phone")
            .eq("id", prod.user_id)
            .single();

          if (!profileError && profile) {
            setSeller(profile);
          } else {
            // Fallback
            setSeller({
              name: "Seller",
              phone: "Not available"
            });
          }
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProductDetails();
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-loading">
            <div className="spinner"></div>
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <div className="modal-error">
            <h2>❌ Product not found</h2>
            <p>This product may have been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="modal-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
          }}
        />
        
        <div className="modal-body">
          <h2>{product.name}</h2>
          <div className="price">₹{parseFloat(product.price).toFixed(2)}</div>
          
          {/* Rating Display */}
          {product.average_rating > 0 && (
            <div className="product-rating-display">
              <span className="rating-stars">
                ⭐ {product.average_rating.toFixed(1)}
              </span>
              <span className="rating-count">
                ({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
          
          {/* Product Details Section */}
          <div className="product-details">
            <h3>📝 Product Details</h3>
            <div className="detail-row">
              <span className="detail-label">Product ID:</span>
              <span className="detail-value">{product.id.slice(0, 8)}...</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Listed:</span>
              <span className="detail-value">
                {getRelativeTime(product.created_at)}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Price:</span>
              <span className="detail-value price-highlight">
                ₹{parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            {product.views !== undefined && (
              <div className="detail-row">
                <span className="detail-label">Views:</span>
                <span className="detail-value">👁️ {product.views || 0}</span>
              </div>
            )}
          </div>

          {/* Seller Information Section */}
          <div className="seller-info">
            <h3>💼 Seller Information</h3>
            <div className="seller-details">
              <div className="detail-row">
                <span className="detail-label">👤 Name:</span>
                <span className="detail-value">
                  {seller?.name || 'Anonymous Seller'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">📱 Phone:</span>
                <span className="detail-value">
                  {seller?.phone || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Actions */}
          {seller?.phone && seller.phone !== 'Not provided' && seller.phone !== 'Not available' && (
            <div className="contact-actions">
              <button 
                className="contact-btn call-btn"
                onClick={() => window.location.href = `tel:${seller.phone}`}
              >
                📞 Call Seller
              </button>
              <button 
                className="contact-btn whatsapp-btn"
                onClick={() => window.open(`https://wa.me/91${seller.phone.replace(/[^0-9]/g, '')}`, '_blank')}
              >
                💬 WhatsApp
              </button>
            </div>
          )}

          {/* Review Section */}
          <ReviewSection productId={product.id} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}
