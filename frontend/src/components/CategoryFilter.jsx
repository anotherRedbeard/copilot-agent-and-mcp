import React from 'react';
import styles from '../styles/BookList.module.css';

const CategoryFilter = ({ categories, selectedCategories, onToggleCategory, onClearCategories }) => {
  if (!categories.length) return null;

  return (
    <section className={styles.categoryFilter} data-testid="category-filter" aria-label="Category filters">
      <div className={styles.categoryFilterHeader}>
        <span className={styles.categoryLegend}>Categories</span>
        {selectedCategories.length > 0 ? (
          <button
            type="button"
            className={styles.clearCategoryBtn}
            onClick={onClearCategories}
            aria-label="Clear selected categories"
          >
            Reset
          </button>
        ) : null}
      </div>
      <div className={styles.categoryOptions} role="group" aria-label="Book category filters">
        {categories.map((category) => {
          const checked = selectedCategories.includes(category);

          return (
            <button
              type="button"
              className={`${styles.categoryChip} ${checked ? styles.categoryChipActive : ''}`}
              key={category}
              onClick={() => onToggleCategory(category)}
              aria-label={`Filter by ${category}`}
              aria-pressed={checked}
            >
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryFilter;