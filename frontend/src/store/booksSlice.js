import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const normalizeSearchValue = (value) => {
  if (typeof value !== 'string') return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

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
  initialState: { items: [], status: 'idle', sortBy: 'title', order: 'asc', searchTerm: '' },
  reducers: {
    setSort(state, action) {
      const { sortBy, order } = action.payload || {};
      if (sortBy === 'title' || sortBy === 'author') state.sortBy = sortBy;
      if (order === 'asc' || order === 'desc') state.order = order;
    },
    setSearchTerm(state, action) {
      state.searchTerm = typeof action.payload === 'string' ? action.payload : '';
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
export const selectFilteredBooks = (state) => {
  const books = selectBooks(state);
  const normalizedSearchTerm = normalizeSearchValue(selectSearchTerm(state));

  if (!normalizedSearchTerm) return books;

  return books.filter((book) => {
    const normalizedTitle = normalizeSearchValue(book?.title);
    const normalizedAuthor = normalizeSearchValue(book?.author);

    return normalizedTitle.includes(normalizedSearchTerm) || normalizedAuthor.includes(normalizedSearchTerm);
  });
};

export const { setSort, setSearchTerm } = booksSlice.actions;
export default booksSlice.reducer;
