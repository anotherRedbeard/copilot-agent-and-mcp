import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// generated-by-copilot: redux slice for the book review system
const API_BASE = 'http://localhost:4000/api/books';

export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (bookId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/${bookId}/reviews`);
      if (!res.ok) return rejectWithValue(`Failed to load reviews (${res.status})`);
      const data = await res.json();
      return { bookId, data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchAverageRating = createAsyncThunk(
  'reviews/fetchAverageRating',
  async (bookId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/${bookId}/average-rating`);
      if (!res.ok) return rejectWithValue(`Failed to load rating (${res.status})`);
      const data = await res.json();
      return { bookId, data };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async ({ token, bookId, rating, text }, { rejectWithValue, dispatch }) => {
    try {
      const res = await fetch(`${API_BASE}/${bookId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ rating, text }),
      });
      if (!res.ok) {
        let message = `Failed to submit review (${res.status})`;
        try {
          const body = await res.json();
          if (body && body.message) message = body.message;
        } catch { /* ignore parse errors */ }
        return rejectWithValue(message);
      }
      // Refresh list + average after a successful submission
      dispatch(fetchReviews(bookId));
      dispatch(fetchAverageRating(bookId));
      return { bookId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialBookState = () => ({
  items: [],
  status: 'idle',
  error: null,
  average: { averageRating: 0, count: 0 },
  averageStatus: 'idle',
  submitStatus: 'idle',
  submitError: null,
});

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: { byBookId: {} },
  reducers: {
    resetSubmitState(state, action) {
      const bookId = action.payload;
      if (state.byBookId[bookId]) {
        state.byBookId[bookId].submitStatus = 'idle';
        state.byBookId[bookId].submitError = null;
      }
    },
  },
  extraReducers: builder => {
    const ensure = (state, bookId) => {
      if (!state.byBookId[bookId]) state.byBookId[bookId] = initialBookState();
      return state.byBookId[bookId];
    };
    builder
      .addCase(fetchReviews.pending, (state, action) => {
        const entry = ensure(state, action.meta.arg);
        entry.status = 'loading';
        entry.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        const { bookId, data } = action.payload;
        const entry = ensure(state, bookId);
        entry.status = 'succeeded';
        entry.items = Array.isArray(data) ? data : [];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        const entry = ensure(state, action.meta.arg);
        entry.status = 'failed';
        entry.error = action.payload || 'Failed to load reviews';
      })
      .addCase(fetchAverageRating.pending, (state, action) => {
        const entry = ensure(state, action.meta.arg);
        entry.averageStatus = 'loading';
      })
      .addCase(fetchAverageRating.fulfilled, (state, action) => {
        const { bookId, data } = action.payload;
        const entry = ensure(state, bookId);
        entry.averageStatus = 'succeeded';
        entry.average = {
          averageRating: Number(data && data.averageRating) || 0,
          count: Number(data && data.count) || 0,
        };
      })
      .addCase(fetchAverageRating.rejected, (state, action) => {
        const entry = ensure(state, action.meta.arg);
        entry.averageStatus = 'failed';
      })
      .addCase(submitReview.pending, (state, action) => {
        const entry = ensure(state, action.meta.arg.bookId);
        entry.submitStatus = 'loading';
        entry.submitError = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        const entry = ensure(state, action.payload.bookId);
        entry.submitStatus = 'succeeded';
        entry.submitError = null;
      })
      .addCase(submitReview.rejected, (state, action) => {
        const entry = ensure(state, action.meta.arg.bookId);
        entry.submitStatus = 'failed';
        entry.submitError = action.payload || 'Failed to submit review';
      });
  },
});

export const { resetSubmitState } = reviewsSlice.actions;
export default reviewsSlice.reducer;
