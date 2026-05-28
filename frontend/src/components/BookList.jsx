
import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchBooks,
  setSort,
  setSearchTerm,
  toggleCategory,
  clearSelectedCategories,
  clearAllBookFilters,
  selectFilteredBooks,
  selectAvailableCategories,
} from '../store/booksSlice';
import { addFavorite, removeFavorite, fetchFavorites } from '../store/favoritesSlice';
import { rateBook } from '../store/booksSlice';
import StarRating from './StarRating';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/BookList.module.css';
import BookDetails from './BookDetails';
import SearchInput from './SearchInput';
import CategoryFilter from './CategoryFilter';

const BookList = () => {
  const dispatch = useAppDispatch();
  const books = useAppSelector(selectFilteredBooks);
  const status = useAppSelector(state => state.books.status);
  const sortBy = useAppSelector(state => state.books.sortBy);
  const order = useAppSelector(state => state.books.order);
  const searchTerm = useAppSelector(state => state.books.searchTerm);
  const selectedCategories = useAppSelector(state => state.books.selectedCategories);
  const availableCategories = useAppSelector(selectAvailableCategories);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  const favorites = useAppSelector(state => state.favorites.items);
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchBooks());
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate, sortBy, order]);

  useEffect(() => {
    if (!books.length) {
      setSelectedBookId(null);
      return;
    }

    if (selectedBookId === null) {
      setSelectedBookId(books[0].id);
      return;
    }

    const selectedStillExists = books.some(book => book.id === selectedBookId);
    if (!selectedStillExists) {
      setSelectedBookId(books[0].id);
    }
  }, [books, selectedBookId]);

  const selectedBook = useMemo(
    () => books.find(book => book.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  // generated-by-copilot: dispatch rating update to the backend
  const handleRate = (bookId, rating) => {
    dispatch(rateBook({ bookId, rating }));
  };

  const handleToggleFavorite = async (bookId, isFavorite) => {
    if (!token) {
      navigate('/');
      return;
    }
    if (isFavorite) {
      await dispatch(removeFavorite({ token, bookId }));
    } else {
      await dispatch(addFavorite({ token, bookId }));
    }
    dispatch(fetchFavorites(token));
  };

  const handleSortFieldChange = (event) => {
    dispatch(setSort({ sortBy: event.target.value, order }));
  };

  const toggleOrder = () => {
    dispatch(setSort({ sortBy, order: order === 'asc' ? 'desc' : 'asc' }));
  };

  const handleSearchChange = (nextTerm) => {
    dispatch(setSearchTerm(nextTerm));
  };

  const clearSearch = () => {
    dispatch(setSearchTerm(''));
  };

  const handleToggleCategory = (category) => {
    dispatch(toggleCategory(category));
  };

  const clearCategories = () => {
    dispatch(clearSelectedCategories());
  };

  const clearAllFilters = () => {
    dispatch(clearAllBookFilters());
  };

  const hasActiveFilters = Boolean(searchTerm) || selectedCategories.length > 0;

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load books.</div>;

  return (
    <div className={styles.booksPage}>
      <h2>Books</h2>
      <section className={styles.toolbar} aria-label="Book filters and sort controls">
        <div className={styles.toolbarMain}>
          <SearchInput value={searchTerm} onChange={handleSearchChange} onClear={clearSearch} />
          <CategoryFilter
            categories={availableCategories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            onClearCategories={clearCategories}
          />
        </div>
        <div className={styles.toolbarSide}>
          <label htmlFor="book-sort-field" className={styles.sortLabel}>Sort by</label>
          <select
            id="book-sort-field"
            className={styles.sortSelect}
            value={sortBy}
            onChange={handleSortFieldChange}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>
          <button
            type="button"
            className={styles.sortOrderBtn}
            onClick={toggleOrder}
            aria-label={`Toggle sort order, currently ${order === 'asc' ? 'ascending' : 'descending'}`}
            aria-pressed={order === 'desc'}
          >
            {order === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
        <div className={styles.toolbarMeta}>
          <span className={styles.resultsCount} aria-live="polite">
            {books.length} result{books.length === 1 ? '' : 's'}
          </span>
          <span className={styles.sortIndicator}>
            Sorted by {sortBy} ({order === 'asc' ? 'A-Z' : 'Z-A'})
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.resetFiltersBtn}
              onClick={clearAllFilters}
              aria-label="Clear all filters"
            >
              Clear all filters
            </button>
          )}
        </div>
      </section>
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
          <p>{hasActiveFilters ? 'No books match the selected filters.' : 'No books available.'}</p>
          <p>
            {hasActiveFilters
              ? 'Try a different search phrase/category, or clear filters to reset the list.'
              : 'Check back later or add a new book if you have permission.'}
          </p>
          {hasActiveFilters ? (
            <button className={styles.resetFiltersBtn} type="button" onClick={clearAllFilters}>Clear all filters</button>
          ) : null}
        </div>
      ) : (
        <div className={styles.booksContent}>
          <div className={styles.bookGrid}>
            {books.map(book => {
              const isFavorite = favorites.some(fav => fav.id === book.id);
              const isSelected = selectedBookId === book.id;

              return (
                <div
                  className={styles.bookCard + ' ' + styles.bookCardWithHeart + ' ' + (isSelected ? styles.selectedBookCard : '')}
                  key={book.id}
                  data-testid="book-card"
                  onClick={() => setSelectedBookId(book.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedBookId(book.id);
                    }
                  }}
                  aria-label={`View details for ${book.title}`}
                >
                  {isFavorite && (
                    <span className={styles.favoriteHeart} title="In Favorites">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#e25555" stroke="#e25555" strokeWidth="1.5">
                        <path d="M12 21s-6.2-5.2-8.4-7.4C1.2 11.2 1.2 8.1 3.1 6.2c1.9-1.9 5-1.9 6.9 0l2 2 2-2c1.9-1.9 5-1.9 6.9 0 1.9 1.9 1.9 5 0 6.9C18.2 15.8 12 21 12 21z"/>
                      </svg>
                    </span>
                  )}
                  <div className={styles.bookTitle}>{book.title}</div>
                  <div className={styles.bookAuthor}>by {book.author}</div>
                  <div className={styles.bookCategories}>
                    {(book.categories || []).map((category) => (
                      <span className={styles.categoryBadge} key={`${book.id}-${category}`}>
                        {category}
                      </span>
                    ))}
                  </div>
                  <div onClick={event => event.stopPropagation()}>
                    <StarRating
                      rating={book.rating || 0}
                      onRate={(value) => handleRate(book.id, value)}
                    />
                  </div>
                  <button
                    className={styles.simpleBtn}
                    onClick={event => {
                      event.stopPropagation();
                      handleToggleFavorite(book.id, isFavorite);
                    }}
                    aria-pressed={isFavorite}
                  >
                    {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </button>
                </div>
              );
            })}
          </div>
          <BookDetails book={selectedBook} />
        </div>
      )}
    </div>
  );
};

export default BookList;
