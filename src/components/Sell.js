// src/components/Sell.js
import React, { useState } from "react";
import supabase from "../supabaseClient";

export default function Sell({ user }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    image: null,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      setForm({ ...form, [name]: files[0] });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validate inputs
      if (!form.name || !form.price || !form.image) {
        throw new Error("Please fill all fields");
      }

      if (form.price <= 0) {
        throw new Error("Price must be greater than 0");
      }

      // 1. Upload image to Supabase Storage
      const filename = `${user.id}-${Date.now()}-${form.image.name}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filename, form.image);

      if (uploadError) {
        throw new Error("Image upload failed: " + uploadError.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filename);

      // 2. Insert into products table
      const { error: insertError } = await supabase
        .from("products")
        .insert([
          {
            name: form.name,
            price: parseFloat(form.price),
            image_url: publicUrl,
            user_id: user.id,
          },
        ]);

      if (insertError) throw insertError;

      setSuccess("🎉 Product listed successfully!");
      
      // Reset form
      setForm({ name: "", price: "", image: null });
      setImagePreview(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-container">
      <div className="sell-card">
        <div className="sell-header">
          <h2>📦 List Your Product</h2>
          <p className="sell-subtitle">Fill in the details to sell your product</p>
        </div>

        <form onSubmit={handleSubmit} className="sell-form">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g., iPhone 14 Pro Max"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (₹) *</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="e.g., 999.99"
              value={form.price}
              onChange={handleChange}
              required
              min="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Product Image *</label>
            <div className="file-input-wrapper">
              <input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleChange}
                required
                className="file-input"
              />
              <label htmlFor="image" className="file-input-label">
                <span className="file-icon">📷</span>
                <span>{form.image ? form.image.name : "Choose an image"}</span>
              </label>
            </div>
          </div>

          {imagePreview && (
            <div className="image-preview-container">
              <p className="preview-label">Image Preview:</p>
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, image: null });
                  setImagePreview(null);
                }}
                className="remove-image-btn"
              >
                ✕ Remove Image
              </button>
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <button type="submit" className="sell-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Listing Product...
              </>
            ) : (
              <>🚀 List Product</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
