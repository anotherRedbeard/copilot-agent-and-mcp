import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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
  initialState: { items: [], status: 'idle', sortBy: 'title', order: 'asc' },
  reducers: {
    setSort(state, action) {
      const { sortBy, order } = action.payload || {};
      if (sortBy === 'title' || sortBy === 'author') state.sortBy = sortBy;
      if (order === 'asc' || order === 'desc') state.order = order;
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

export const { setSort } = booksSlice.actions;
export default booksSlice.reducer;
