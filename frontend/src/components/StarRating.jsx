// generated-by-copilot: star rating component — renders 1-5 clickable stars
import React from 'react';
import styles from '../styles/StarRating.module.css';

const StarRating = ({ rating = 0, onRate }) => {
  return (
    <div className={styles.starRating} aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          className={`${styles.star} ${star <= rating ? styles.filled : styles.empty}`}
          onClick={() => onRate && onRate(star)}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );
};

export default StarRating;
