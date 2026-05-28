import { describe, it, expect } from 'vitest';
import booksReducer, {
  setSearchTerm,
  toggleCategory,
  clearSelectedCategories,
  selectAvailableCategories,
  selectFilteredBooks,
} from './booksSlice';

describe('booksSlice search behavior', () => {
  it('updates search term in state', () => {
    const initialState = { items: [], status: 'idle', sortBy: 'title', order: 'asc', searchTerm: '' };
    const state = booksReducer(initialState, setSearchTerm('tolkien'));

    expect(state.searchTerm).toBe('tolkien');
  });

  it('returns all books for empty search term', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien' },
          { id: 2, title: 'Dune', author: 'Frank Herbert' },
        ],
        searchTerm: '',
      },
    };

    expect(selectFilteredBooks(state)).toHaveLength(2);
  });

  it('filters by title and author', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien' },
          { id: 2, title: 'Dune', author: 'Frank Herbert' },
          { id: 3, title: 'Hamlet', author: 'William Shakespeare' },
        ],
        searchTerm: 'tolkien',
      },
    };

    const filtered = selectFilteredBooks(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('The Hobbit');
  });

  it('is case insensitive', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'DUNE', author: 'Frank Herbert' },
          { id: 2, title: 'Foundation', author: 'Isaac Asimov' },
        ],
        searchTerm: 'dune',
      },
    };

    const filtered = selectFilteredBooks(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('DUNE');
  });

  it('handles accented characters as accent-insensitive matches', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'Cien anos de soledad', author: 'Gabriel Garcia Marquez' },
          { id: 2, title: 'No Longer Human', author: 'Osamu Dazai' },
        ],
        searchTerm: 'garcía márquez',
      },
    };

    const filtered = selectFilteredBooks(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].author).toBe('Gabriel Garcia Marquez');
  });

  it('handles special characters without throwing', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'C++ Primer', author: 'Lippman' },
          { id: 2, title: 'Effective Java', author: 'Joshua Bloch' },
        ],
        searchTerm: 'c++',
      },
    };

    const filtered = selectFilteredBooks(state);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('C++ Primer');
  });

  it('toggles category selections in state', () => {
    const initialState = {
      items: [],
      status: 'idle',
      sortBy: 'title',
      order: 'asc',
      searchTerm: '',
      selectedCategories: [],
    };

    const withFantasy = booksReducer(initialState, toggleCategory('Fantasy'));
    expect(withFantasy.selectedCategories).toEqual(['Fantasy']);

    const withoutFantasy = booksReducer(withFantasy, toggleCategory('Fantasy'));
    expect(withoutFantasy.selectedCategories).toEqual([]);
  });

  it('clears selected categories', () => {
    const initialState = {
      items: [],
      status: 'idle',
      sortBy: 'title',
      order: 'asc',
      searchTerm: '',
      selectedCategories: ['Fantasy', 'Classic'],
    };

    const state = booksReducer(initialState, clearSelectedCategories());
    expect(state.selectedCategories).toEqual([]);
  });

  it('derives a unique sorted category list from books', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', categories: ['Fantasy', 'Adventure'] },
          { id: 2, title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', categories: ['Fantasy'] },
          { id: 3, title: 'Emma', author: 'Jane Austen', categories: ['Classic'] },
        ],
      },
    };

    expect(selectAvailableCategories(state)).toEqual(['Adventure', 'Classic', 'Fantasy']);
  });

  it('filters by selected category with OR behavior', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', categories: ['Fantasy', 'Adventure'] },
          { id: 2, title: 'Dune', author: 'Frank Herbert', categories: ['Science Fiction'] },
          { id: 3, title: 'Pride and Prejudice', author: 'Jane Austen', categories: ['Classic', 'Romance'] },
        ],
        searchTerm: '',
        selectedCategories: ['Fantasy', 'Romance'],
      },
    };

    const filtered = selectFilteredBooks(state);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(book => book.title)).toEqual(['The Hobbit', 'Pride and Prejudice']);
  });

  it('combines search and category filters', () => {
    const state = {
      books: {
        items: [
          { id: 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', categories: ['Fantasy'] },
          { id: 2, title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', categories: ['Fantasy'] },
          { id: 3, title: 'Emma', author: 'Jane Austen', categories: ['Classic'] },
        ],
        searchTerm: 'tolkien',
        selectedCategories: ['Fantasy'],
      },
    };

    const filtered = selectFilteredBooks(state);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(book => book.title)).toEqual(['The Hobbit', 'The Lord of the Rings']);
  });
});
