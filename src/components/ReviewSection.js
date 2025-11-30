import React, { useState, useEffect } from 'react';
import supabase from '../supabaseClient';

export default function ReviewSection({ productId, currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      // Fetch all reviews with user profiles
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);

      // Check if current user has reviewed
      if (currentUser) {
        const myReview = reviewsData?.find(r => r.user_id === currentUser.id);
        setUserReview(myReview);
        if (myReview) {
          setRating(myReview.rating);
          setComment(myReview.comment || '');
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to leave a review');
      return;
    }

    setLoading(true);
    try {
      if (userReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({ rating, comment, created_at: new Date() })
          .eq('id', userReview.id);

        if (error) throw error;
        alert('✅ Review updated successfully!');
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            product_id: productId,
            user_id: currentUser.id,
            rating,
            comment
          });

        if (error) throw error;
        alert('✅ Review submitted successfully!');
      }

      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Delete your review?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', userReview.id);

      if (error) throw error;

      setUserReview(null);
      setRating(5);
      setComment('');
      fetchReviews();
      alert('✅ Review deleted!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onStarClick && onStarClick(star)}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="review-section">
      <h3>⭐ Reviews & Ratings</h3>

      {/* Write Review Button */}
      {currentUser && !showReviewForm && (
        <button 
          className="write-review-btn"
          onClick={() => setShowReviewForm(true)}
        >
          {userReview ? '✏️ Edit Your Review' : '✍️ Write a Review'}
        </button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmitReview} className="review-form">
          <h4>{userReview ? 'Edit Your Review' : 'Write Your Review'}</h4>
          
          <div className="form-group">
            <label>Your Rating:</label>
            {renderStars(rating, true, setRating)}
          </div>

          <div className="form-group">
            <label>Your Comment (Optional):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-review-btn" disabled={loading}>
              {loading ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setShowReviewForm(false)}
            >
              Cancel
            </button>
            {userReview && (
              <button 
                type="button" 
                className="delete-review-btn"
                onClick={handleDeleteReview}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.profiles?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <strong>{review.profiles?.name || 'Anonymous'}</strong>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
