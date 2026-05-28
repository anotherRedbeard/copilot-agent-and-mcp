import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchFavorites = createAsyncThunk('favorites/fetchFavorites', async (token) => {
  const res = await fetch('http://localhost:4000/api/favorites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
});

export const addFavorite = createAsyncThunk('favorites/addFavorite', async ({ token, bookId }) => {
  await fetch('http://localhost:4000/api/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });
  return bookId;
});

export const removeFavorite = createAsyncThunk('favorites/removeFavorite', async ({ token, bookId }) => {
  await fetch(`http://localhost:4000/api/favorites/${bookId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return bookId;
});

// generated-by-copilot: save a comment for a favorited book
export const saveComment = createAsyncThunk('favorites/saveComment', async ({ token, bookId, comment }) => {
  await fetch(`http://localhost:4000/api/favorites/${bookId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ comment }),
  });
  return { bookId, comment };
});

// generated-by-copilot: clear all favorites for the current user
export const clearAllFavorites = createAsyncThunk('favorites/clearAllFavorites', async ({ token }, { rejectWithValue }) => {
  try {
    const res = await fetch('http://localhost:4000/api/favorites', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!res.ok) {
      return rejectWithValue(`Request failed with status ${res.status}`);
    }
    return true;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFavorites.pending, state => { state.status = 'loading'; })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, state => { state.status = 'failed'; })
      .addCase(addFavorite.fulfilled, (state, action) => {
        // After adding, fetch the updated favorites list to ensure UI is in sync
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter(b => b.id !== action.payload);
      })
      // generated-by-copilot: update the comment on the matching favorite item in state
      .addCase(saveComment.fulfilled, (state, action) => {
        const { bookId, comment } = action.payload;
        const item = state.items.find(b => b.id === bookId);
        if (item) item.comment = comment;
      })
      // generated-by-copilot: clear all favorites locally on success
      .addCase(clearAllFavorites.fulfilled, state => {
        state.items = [];
      });
  },
});

export default favoritesSlice.reducer;
