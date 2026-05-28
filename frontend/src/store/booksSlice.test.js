import { describe, it, expect } from 'vitest';
import booksReducer, {
  setSearchTerm,
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
});
