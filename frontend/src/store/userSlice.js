import { createSlice } from '@reduxjs/toolkit';

// generated-by-copilot: role persisted alongside token and username
const initialState = {
  token: localStorage.getItem('token') || null,
  username: localStorage.getItem('username') || null,
  role: localStorage.getItem('role') || null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action) {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.role = action.payload.role || null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('username', action.payload.username);
      if (action.payload.role) {
        localStorage.setItem('role', action.payload.role);
      } else {
        localStorage.removeItem('role');
      }
    },
    logout(state) {
      state.token = null;
      state.username = null;
      state.role = null;
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
