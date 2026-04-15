
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBooks, setSortBy, setSortOrder } from '../store/booksSlice';
import { addFavorite, fetchFavorites } from '../store/favoritesSlice';
import { fetchReviews, fetchAverageRating, submitReview, clearSubmitError } from '../store/reviewsSlice';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/BookList.module.css';

// generated-by-copilot: star rating display component
const StarRating = ({ rating, onRate, interactive = false }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <span className={styles.starRating}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`${styles.star} ${(interactive && hovered >= star) || rating >= star ? styles.starFilled : styles.starEmpty}`}
          onClick={interactive ? () => onRate(star) : undefined}
          onMouseEnter={interactive ? () => setHovered(star) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? 0 : undefined}
          onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRate(star); } } : undefined}
          aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : `${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </span>
  );
};

// generated-by-copilot: review form component for submitting a new review
const ReviewForm = ({ bookId, token, dispatch, submitStatus, submitError }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    dispatch(clearSubmitError());
    if (rating < 1 || rating > 5) {
      setValidationError('Please select a rating (1-5 stars)');
      return;
    }
    if (!reviewText.trim()) {
      setValidationError('Please enter review text');
      return;
    }
    const result = await dispatch(submitReview({ token, bookId, rating, reviewText: reviewText.trim() }));
    if (result.type === 'reviews/submitReview/fulfilled') {
      setRating(0);
      setReviewText('');
      dispatch(fetchReviews(bookId));
      dispatch(fetchAverageRating(bookId));
    }
  };

  return (
    <form className={styles.reviewForm} onSubmit={handleSubmit}>
      <div className={styles.reviewFormRating}>
        <span className={styles.reviewFormLabel}>Your Rating:</span>
        <StarRating rating={rating} onRate={setRating} interactive />
      </div>
      <textarea
        className={styles.reviewTextarea}
        rows={3}
        value={reviewText}
        onChange={e => setReviewText(e.target.value)}
        placeholder="Write your review..."
        maxLength={1000}
      />
      {validationError && <div className={styles.reviewError}>{validationError}</div>}
      {submitError && <div className={styles.reviewError}>{submitError}</div>}
      <button
        type="submit"
        className={styles.submitReviewBtn}
        disabled={submitStatus === 'loading'}
      >
        {submitStatus === 'loading' ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
};

// generated-by-copilot: reviews section for displaying and submitting reviews on a book card
const ReviewsSection = ({ bookId, token, dispatch, reviewsState, averageData, submitStatus, submitError, username }) => {
  const [expanded, setExpanded] = useState(false);
  const bookReviews = reviewsState?.reviews || [];
  const reviewsStatus = reviewsState?.status || 'idle';
  const avg = averageData || { averageRating: 0, totalReviews: 0 };
  const hasReviewed = bookReviews.some(r => r.username === username);

  useEffect(() => {
    dispatch(fetchAverageRating(bookId));
  }, [dispatch, bookId]);

  const handleToggle = () => {
    if (!expanded) {
      dispatch(fetchReviews(bookId));
    }
    setExpanded(!expanded);
  };

  return (
    <div className={styles.reviewsSection}>
      <div className={styles.reviewsSummary}>
        <StarRating rating={Math.round(avg.averageRating)} />
        <span className={styles.avgRatingText}>
          {avg.totalReviews > 0 ? `${avg.averageRating} (${avg.totalReviews} review${avg.totalReviews !== 1 ? 's' : ''})` : 'No reviews yet'}
        </span>
      </div>
      <button className={styles.toggleReviewsBtn} onClick={handleToggle}>
        {expanded ? 'Hide Reviews' : 'Show Reviews'}
      </button>
      {expanded && (
        <div className={styles.reviewsExpanded}>
          {reviewsStatus === 'loading' && <div className={styles.reviewsLoading}>Loading reviews...</div>}
          {reviewsStatus === 'failed' && <div className={styles.reviewError}>Failed to load reviews.</div>}
          {reviewsStatus === 'succeeded' && (
            <>
              {bookReviews.length === 0 ? (
                <div className={styles.noReviews}>No reviews yet. Be the first!</div>
              ) : (
                <div className={styles.reviewsList}>
                  {bookReviews.map(review => (
                    <div key={review.id} className={styles.reviewItem}>
                      <div className={styles.reviewHeader}>
                        <span className={styles.reviewUser}>{review.username}</span>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className={styles.reviewText}>{review.reviewText}</p>
                      <span className={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!hasReviewed && token && (
                <ReviewForm
                  bookId={bookId}
                  token={token}
                  dispatch={dispatch}
                  submitStatus={submitStatus}
                  submitError={submitError}
                />
              )}
              {hasReviewed && <div className={styles.alreadyReviewed}>You have already reviewed this book.</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const BookList = () => {
  const dispatch = useAppDispatch();
  const books = useAppSelector(state => state.books.items);
  const status = useAppSelector(state => state.books.status);
  const sortBy = useAppSelector(state => state.books.sortBy);
  const sortOrder = useAppSelector(state => state.books.sortOrder);
  const token = useAppSelector(state => state.user.token);
  const username = useAppSelector(state => state.user.username);
  const navigate = useNavigate();
  const favorites = useAppSelector(state => state.favorites.items);
  const reviewsByBookId = useAppSelector(state => state.reviews.byBookId);
  const averages = useAppSelector(state => state.reviews.averages);
  const submitStatus = useAppSelector(state => state.reviews.submitStatus);
  const submitError = useAppSelector(state => state.reviews.submitError);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchBooks());
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate, sortBy, sortOrder]);

  const handleSortByChange = (e) => {
    dispatch(setSortBy(e.target.value));
  };

  const handleToggleOrder = () => {
    dispatch(setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'));
  };

  const handleAddFavorite = async (bookId) => {
    if (!token) {
      navigate('/');
      return;
    }
    await dispatch(addFavorite({ token, bookId }));
    dispatch(fetchFavorites(token));
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load books.</div>;

  return (
    <div>
      <h2>Books</h2>
      <div className={styles.sortControls}>
        <label htmlFor="sortBy">Sort by:</label>
        <select id="sortBy" value={sortBy} onChange={handleSortByChange} className={styles.sortSelect}>
          <option value="">Default</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
        </select>
        {sortBy && (
          <button
            className={styles.sortOrderBtn}
            onClick={handleToggleOrder}
            aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑ A–Z' : '↓ Z–A'}
          </button>
        )}
      </div>
      {books.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '2rem auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>No books available.</p>
          <p>Check back later or add a new book if you have permission.</p>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {books.map(book => {
            const isFavorite = favorites.some(fav => fav.id === book.id);
            return (
              <div className={styles.bookCard + ' ' + styles.bookCardWithHeart + (book.description ? ' ' + styles.bookCardExpanded : '')} key={book.id}>
                {isFavorite && (
                  <span className={styles.favoriteHeart} title="In Favorites">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#e25555" stroke="#e25555" strokeWidth="1.5">
                      <path d="M12 21s-6.2-5.2-8.4-7.4C1.2 11.2 1.2 8.1 3.1 6.2c1.9-1.9 5-1.9 6.9 0l2 2 2-2c1.9-1.9 5-1.9 6.9 0 1.9 1.9 1.9 5 0 6.9C18.2 15.8 12 21 12 21z"/>
                    </svg>
                  </span>
                )}
                <div className={styles.bookTitle}>{book.title}</div>
                <div className={styles.bookAuthor}>by {book.author}</div>
                {book.date && (
                  <div className={styles.bookDate}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {new Date(book.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                )}
                {book.description && (
                  <p className={styles.bookDescription}>{book.description}</p>
                )}
                <button
                  className={styles.simpleBtn}
                  onClick={() => handleAddFavorite(book.id)}
                >
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </button>
                <ReviewsSection
                  bookId={book.id}
                  token={token}
                  dispatch={dispatch}
                  reviewsState={reviewsByBookId[book.id]}
                  averageData={averages[book.id]}
                  submitStatus={submitStatus}
                  submitError={submitError}
                  username={username}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookList;
