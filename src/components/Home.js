// src/components/Home.js
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import supabase from "../supabaseClient";
import SearchBar from './SearchBar';

export default function Home({ openProductModal }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });

    fetchProducts();
  }, []);

  // Fetch wishlist when user is available
  useEffect(() => {
    if (currentUser) {
      fetchWishlist();
    }
  }, [currentUser]);

  async function fetchProducts() {
    try {
      setLoading(true);
      let { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, user_id, created_at, average_rating, review_count")
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch user's wishlist
  const fetchWishlist = async () => {
    try {
      const { data } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', currentUser.id);
      
      setWishlist(data?.map(item => item.product_id) || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  // Toggle wishlist
  const toggleWishlist = async (productId, e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please login to save products to wishlist');
      return;
    }

    const isInWishlist = wishlist.includes(productId);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('product_id', productId);
        
        setWishlist(wishlist.filter(id => id !== productId));
      } else {
        // Add to wishlist
        await supabase
          .from('wishlist')
          .insert({ user_id: currentUser.id, product_id: productId });
        
        setWishlist([...wishlist, productId]);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Search function
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // Filter/Sort function
  const handleFilter = (sortType) => {
    let sorted = [...filteredProducts];
    
    switch(sortType) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'price-low':
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      default:
        break;
    }
    
    setFilteredProducts(sorted);
  };

  const handleDelete = async (productId, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      // Extract filename from image URL
      const filename = imageUrl.split('/').pop();

      // Delete from storage first
      if (filename) {
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .remove([filename]);
        
        if (storageError) console.error("Storage delete error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (dbError) throw dbError;

      // Remove from UI
      const updatedProducts = products.filter(p => p.id !== productId);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      alert("✅ Product deleted successfully!");
    } catch (err) {
      alert("⚠️ Error deleting product: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-state">
          <h2>⚠️ Oops!</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>🛍️ Discover Amazing Products</h1>
        <p>Browse through our marketplace and find what you need</p>
        {products.length > 0 && (
          <div className="product-count">
            <span>{products.length} {products.length === 1 ? 'Product' : 'Products'} Available</span>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No Products Yet</h2>
          <p>Be the first to list a product in our marketplace!</p>
        </div>
      ) : (
        <>
          {/* Search & Filter Bar */}
          <SearchBar onSearch={handleSearch} onFilter={handleFilter} />

          {/* Show filtered count if searching */}
          {searchTerm && (
            <div className="search-results-info">
              <p>Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} for "{searchTerm}"</p>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <h3>😕 No products found</h3>
              <p>Try searching with different keywords</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="product-card">
                  <div 
                    className="product-image-container"
                    onClick={() => openProductModal(prod.id)}
                  >
                    {/* Wishlist Heart Button */}
                    <button 
                      className={`wishlist-heart-btn ${wishlist.includes(prod.id) ? 'active' : ''}`}
                      onClick={(e) => toggleWishlist(prod.id, e)}
                      title={wishlist.includes(prod.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      {wishlist.includes(prod.id) ? '❤️' : '🤍'}
                    </button>

                    <img 
                      src={prod.image_url} 
                      alt={prod.name} 
                      className="product-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x240?text=No+Image';
                      }}
                    />
                    <div className="product-overlay">
                      <span>👁️ View Details</span>
                    </div>
                  </div>
                  <div className="product-info">
                    <h3>{prod.name}</h3>
                    <div className="product-price">₹{parseFloat(prod.price).toFixed(2)}</div>
                    
                    {/* Product Rating */}
                    <div className="product-rating">
                      {prod.average_rating > 0 ? (
                        <>
                          <span className="rating-stars">⭐ {prod.average_rating.toFixed(1)}</span>
                          <span className="rating-count">({prod.review_count} {prod.review_count === 1 ? 'review' : 'reviews'})</span>
                        </>
                      ) : (
                        <span className="no-rating">No reviews yet</span>
                      )}
                    </div>
                    
                    {/* Show edit and delete buttons only for own products */}
                    {currentUser && currentUser.id === prod.user_id && (
                      <div className="product-card-actions">
                        <button 
                          className="edit-product-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-product/${prod.id}`);
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-product-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(prod.id, prod.image_url);
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
