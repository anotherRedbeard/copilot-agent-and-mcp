import React from 'react';
import styles from '../styles/BookList.module.css';

const SearchInput = ({ value, onChange, onClear }) => {
  return (
    <div className={styles.searchInputWrap}>
      <label htmlFor="book-search" className={styles.searchLabel}>Search books:</label>
      <div className={styles.searchInputShell}>
        <span className={styles.searchIcon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.65" y1="16.65" x2="21" y2="21" />
          </svg>
        </span>
        <input
          id="book-search"
          type="search"
          className={styles.searchInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by title or author"
          autoComplete="off"
          aria-label="Search books by title or author"
        />
        {value ? (
          <button
            type="button"
            className={styles.clearSearchBtn}
            onClick={onClear}
            aria-label="Clear search"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SearchInput;
