import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchReviews,
  fetchAverageRating,
  submitReview,
  resetSubmitState,
} from '../store/reviewsSlice';
import styles from '../styles/BookDetails.module.css';

// generated-by-copilot: presentational star rating used in the review form and list
const StarRating = ({ value, onChange, readOnly = false, size = 20, label }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span
      className={styles.starRating}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={label || `Rating: ${value} out of 5`}
    >
      {stars.map(star => {
        const filled = star <= Math.round(value);
        if (readOnly) {
          return (
            <span
              key={star}
              aria-hidden="true"
              className={filled ? styles.starFilled : styles.starEmpty}
              style={{ fontSize: `${size}px` }}
            >
              ★
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            className={`${styles.starButton} ${filled ? styles.starFilled : styles.starEmpty}`}
            onClick={() => onChange(star)}
            style={{ fontSize: `${size}px` }}
          >
            ★
          </button>
        );
      })}
    </span>
  );
};

const BookReviews = ({ bookId }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.user.token);
  const username = useAppSelector(state => state.user.username);
  const entry = useAppSelector(state => state.reviews.byBookId[bookId]);

  const items = entry?.items || [];
  const status = entry?.status || 'idle';
  const error = entry?.error;
  const average = entry?.average || { averageRating: 0, count: 0 };
  const submitStatus = entry?.submitStatus || 'idle';
  const submitError = entry?.submitError;

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!bookId) return;
    dispatch(fetchReviews(bookId));
    dispatch(fetchAverageRating(bookId));
  }, [dispatch, bookId]);

  useEffect(() => {
    // Reset the form whenever the user switches to a different book
    setRating(0);
    setText('');
    setFormError('');
    if (bookId) dispatch(resetSubmitState(bookId));
  }, [bookId, dispatch]);

  useEffect(() => {
    if (submitStatus === 'succeeded') {
      setRating(0);
      setText('');
      setFormError('');
    }
  }, [submitStatus]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!token) {
      setFormError('You must be logged in to submit a review.');
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError('Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!text.trim()) {
      setFormError('Please enter a review.');
      return;
    }
    if (text.length > 2000) {
      setFormError('Review must be 2000 characters or fewer.');
      return;
    }
    dispatch(submitReview({ token, bookId, rating, text: text.trim() }));
  };

  return (
    <section className={styles.reviewsSection} aria-label="Book reviews">
      <div className={styles.reviewsHeader}>
        <h4 className={styles.reviewsTitle}>Reviews</h4>
        <div className={styles.reviewsAverage} aria-live="polite">
          {average.count > 0 ? (
            <>
              <StarRating value={average.averageRating} readOnly size={18} label={`Average rating: ${average.averageRating} out of 5`} />
              <span className={styles.reviewsAverageText}>
                {average.averageRating.toFixed(1)} ({average.count} review{average.count === 1 ? '' : 's'})
              </span>
            </>
          ) : (
            <span className={styles.reviewsAverageText}>No ratings yet</span>
          )}
        </div>
      </div>

      {token ? (
        <form className={styles.reviewForm} onSubmit={handleSubmit} aria-label="Submit a review">
          <label className={styles.reviewFormLabel}>
            Your rating
            <StarRating value={rating} onChange={setRating} size={24} />
          </label>
          <label className={styles.reviewFormLabel} htmlFor={`review-text-${bookId}`}>
            Your review
          </label>
          <textarea
            id={`review-text-${bookId}`}
            className={styles.reviewTextarea}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share your thoughts about this book..."
            rows={3}
            maxLength={2000}
          />
          {(formError || submitError) && (
            <p role="alert" className={styles.reviewError}>
              {formError || submitError}
            </p>
          )}
          {submitStatus === 'succeeded' && !formError && (
            <p role="status" className={styles.reviewSuccess}>Thanks for your review!</p>
          )}
          <button
            type="submit"
            className={styles.reviewSubmitBtn}
            disabled={submitStatus === 'loading'}
          >
            {submitStatus === 'loading' ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      ) : (
        <p className={styles.reviewLoginNotice}>Log in to leave a review.</p>
      )}

      <div className={styles.reviewsList} aria-live="polite">
        {status === 'loading' && <p className={styles.reviewsStatus}>Loading reviews...</p>}
        {status === 'failed' && (
          <p role="alert" className={styles.reviewError}>{error || 'Failed to load reviews.'}</p>
        )}
        {status === 'succeeded' && items.length === 0 && (
          <p className={styles.reviewsStatus}>Be the first to review this book.</p>
        )}
        {status === 'succeeded' && items.length > 0 && (
          <ul className={styles.reviewItems}>
            {items.map(review => (
              <li key={review.id} className={styles.reviewItem}>
                <div className={styles.reviewItemHeader}>
                  <StarRating value={review.rating} readOnly size={16} label={`${review.rating} out of 5 stars`} />
                  <span className={styles.reviewItemAuthor}>
                    {review.username || 'Anonymous'}
                    {review.username && username === review.username ? ' (you)' : ''}
                  </span>
                  {review.createdAt && (
                    <span className={styles.reviewItemDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className={styles.reviewItemText}>{review.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default BookReviews;
