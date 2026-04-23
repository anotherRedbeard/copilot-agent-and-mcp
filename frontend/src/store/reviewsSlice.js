import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// generated-by-copilot: async thunks for the book review system

export const fetchReviews = createAsyncThunk('reviews/fetchReviews', async (bookId) => {
  const res = await fetch(`http://localhost:4000/api/books/${bookId}/reviews`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const data = await res.json();
  return { bookId, reviews: data };
});

export const fetchAverageRating = createAsyncThunk('reviews/fetchAverageRating', async (bookId) => {
  const res = await fetch(`http://localhost:4000/api/books/${bookId}/average-rating`);
  if (!res.ok) throw new Error('Failed to fetch average rating');
  const data = await res.json();
  return { bookId, ...data };
});

export const submitReview = createAsyncThunk('reviews/submitReview', async ({ token, bookId, rating, reviewText }) => {
  const res = await fetch(`http://localhost:4000/api/books/${bookId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, reviewText }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Failed to submit review');
  }
  return await res.json();
});

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    // generated-by-copilot: keyed by bookId for per-book review state
    byBookId: {},       // { [bookId]: { reviews: [], status: 'idle', error: null } }
    averages: {},       // { [bookId]: { averageRating: 0, totalReviews: 0 } }
    submitStatus: 'idle',
    submitError: null,
  },
  reducers: {
    clearSubmitError(state) {
      state.submitError = null;
      state.submitStatus = 'idle';
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchReviews.pending, (state, action) => {
        const bookId = action.meta.arg;
        if (!state.byBookId[bookId]) state.byBookId[bookId] = { reviews: [], status: 'idle', error: null };
        state.byBookId[bookId].status = 'loading';
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        const { bookId, reviews } = action.payload;
        state.byBookId[bookId] = { reviews, status: 'succeeded', error: null };
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        const bookId = action.meta.arg;
        if (!state.byBookId[bookId]) state.byBookId[bookId] = { reviews: [], status: 'idle', error: null };
        state.byBookId[bookId].status = 'failed';
        state.byBookId[bookId].error = action.error.message;
      })
      .addCase(fetchAverageRating.fulfilled, (state, action) => {
        const { bookId, averageRating, totalReviews } = action.payload;
        state.averages[bookId] = { averageRating, totalReviews };
      })
      .addCase(submitReview.pending, (state) => {
        state.submitStatus = 'loading';
        state.submitError = null;
      })
      .addCase(submitReview.fulfilled, (state) => {
        state.submitStatus = 'succeeded';
        state.submitError = null;
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.error.message;
      });
  },
});

export const { clearSubmitError } = reviewsSlice.actions;
export default reviewsSlice.reducer;
