import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price: '',
  });
  const [newImage, setNewImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: prod, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Check if user owns this product
      if (prod.user_id !== user.id) {
        alert('You can only edit your own products!');
        navigate('/');
        return;
      }

      setProduct(prod);
      setForm({
        name: prod.name,
        price: prod.price,
      });
      setPreviewUrl(prod.image_url);
    } catch (error) {
      console.error('Error:', error);
      alert('Error loading product');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setNewImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let imageUrl = product.image_url;

      // If new image is selected, upload it
      if (newImage) {
        // Delete old image
        const oldFilename = product.image_url.split('/').pop();
        await supabase.storage
          .from('product-images')
          .remove([oldFilename]);

        // Upload new image
        const fileExt = newImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, newImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: form.name,
          price: parseFloat(form.price),
          image_url: imageUrl,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      alert('✅ Product updated successfully!');
      navigate('/profile');
    } catch (error) {
      setError(error.message);
      alert('Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="sell-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sell-container">
      <div className="sell-card">
        <h2>✏️ Edit Product</h2>
        <p className="subtitle">Update your product details</p>

        <form onSubmit={handleSubmit} className="sell-form">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              type="text"
              placeholder="e.g., iPhone 13 Pro"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (₹) *</label>
            <input
              id="price"
              type="number"
              placeholder="e.g., 25000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              min="1"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Product Image (Optional)</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <small className="input-hint">
              Upload a new image only if you want to change it (Max 5MB)
            </small>
          </div>

          {previewUrl && (
            <div className="image-preview">
              <p className="preview-label">Current/Preview Image:</p>
              <img src={previewUrl} alt="Preview" />
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-small"></span>
                  Updating...
                </>
              ) : (
                '✅ Update Product'
              )}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
