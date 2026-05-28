import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const normalizeSearchValue = (value) => {
  if (typeof value !== 'string') return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const normalizeCategorySelection = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const getBookCategories = (book) => {
  if (Array.isArray(book?.categories)) return book.categories;
  if (typeof book?.category === 'string') return [book.category];
  return [];
};

const normalizeCategoryForComparison = (value) => normalizeSearchValue(value);

export const fetchBooks = createAsyncThunk('books/fetchBooks', async (_arg, { getState }) => {
  const { sortBy, order } = getState().books;
  const params = new URLSearchParams();
  if (sortBy) params.set('sortBy', sortBy);
  if (order) params.set('order', order);
  const qs = params.toString();
  const url = `http://localhost:4000/api/books${qs ? `?${qs}` : ''}`;
  const res = await fetch(url);
  return res.json();
});

const booksSlice = createSlice({
  name: 'books',
  initialState: {
    items: [],
    status: 'idle',
    sortBy: 'title',
    order: 'asc',
    searchTerm: '',
    selectedCategories: [],
  },
  reducers: {
    setSort(state, action) {
      const { sortBy, order } = action.payload || {};
      if (sortBy === 'title' || sortBy === 'author') state.sortBy = sortBy;
      if (order === 'asc' || order === 'desc') state.order = order;
    },
    setSearchTerm(state, action) {
      state.searchTerm = typeof action.payload === 'string' ? action.payload : '';
    },
    toggleCategory(state, action) {
      const category = normalizeCategorySelection(action.payload);
      if (!category) return;

      const existingIndex = state.selectedCategories.findIndex(
        value => normalizeCategoryForComparison(value) === normalizeCategoryForComparison(category)
      );

      if (existingIndex >= 0) {
        state.selectedCategories.splice(existingIndex, 1);
      } else {
        state.selectedCategories.push(category);
      }
    },
    clearSelectedCategories(state) {
      state.selectedCategories = [];
    },
    clearAllBookFilters(state) {
      state.searchTerm = '';
      state.selectedCategories = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBooks.pending, state => { state.status = 'loading'; })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBooks.rejected, state => { state.status = 'failed'; });
  },
});

export const selectBooks = (state) => state.books.items;
export const selectSearchTerm = (state) => state.books.searchTerm;
export const selectSelectedCategories = (state) => state.books.selectedCategories;
export const selectAvailableCategories = (state) => {
  const books = selectBooks(state);
  const categoriesByKey = new Map();

  books.forEach((book) => {
    getBookCategories(book).forEach((category) => {
      const normalized = normalizeCategorySelection(category);
      if (!normalized) return;

      const key = normalizeCategoryForComparison(normalized);
      if (!categoriesByKey.has(key)) {
        categoriesByKey.set(key, normalized);
      }
    });
  });

  return Array.from(categoriesByKey.values()).sort((a, b) => a.localeCompare(b));
};
export const selectFilteredBooks = (state) => {
  const books = selectBooks(state);
  const normalizedSearchTerm = normalizeSearchValue(selectSearchTerm(state));
  const selectedCategories = (selectSelectedCategories(state) || []).map(normalizeCategoryForComparison);

  return books.filter((book) => {
    const normalizedTitle = normalizeSearchValue(book?.title);
    const normalizedAuthor = normalizeSearchValue(book?.author);
    const normalizedCategories = getBookCategories(book).map(normalizeCategoryForComparison);

    const matchesSearch = !normalizedSearchTerm
      || normalizedTitle.includes(normalizedSearchTerm)
      || normalizedAuthor.includes(normalizedSearchTerm);

    const matchesCategory = selectedCategories.length === 0
      || normalizedCategories.some((category) => selectedCategories.includes(category));

    return matchesSearch && matchesCategory;
  });
};

export const {
  setSort,
  setSearchTerm,
  toggleCategory,
  clearSelectedCategories,
  clearAllBookFilters,
} = booksSlice.actions;
export default booksSlice.reducer;
