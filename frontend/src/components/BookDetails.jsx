import React from 'react';
import styles from '../styles/BookDetails.module.css';
import BookReviews from './BookReviews';

const BookDetails = ({ book }) => {
  if (!book) {
    return (
      <aside className={styles.detailsPanel}>
        <h3 className={styles.title}>Book Details</h3>
        <p className={styles.placeholder}>Select a book to view more information.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.detailsPanel} aria-live="polite">
      <h3 className={styles.title}>{book.title}</h3>
      <dl className={styles.detailsList}>
        <div className={styles.detailsRow}>
          <dt>Author</dt>
          <dd>{book.author || 'Unknown'}</dd>
        </div>
        <div className={styles.detailsRow}>
          <dt>Publication Date</dt>
          <dd>{book.date || 'Not available'}</dd>
        </div>
        <div className={styles.detailsRow}>
          <dt>Summary</dt>
          <dd>{book.summary || 'Summary not available for this book.'}</dd>
        </div>
        <div className={styles.detailsRow}>
          <dt>Categories</dt>
          <dd>{Array.isArray(book.categories) && book.categories.length > 0 ? book.categories.join(', ') : 'Not available'}</dd>
        </div>
      </dl>
      <BookReviews bookId={book.id} />
    </aside>
  );
};

export default BookDetails;