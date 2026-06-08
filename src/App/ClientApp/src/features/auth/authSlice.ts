import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { parseJwt } from "../../utils/jwt";

const TOKEN_KEY = "accessToken";

export interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  role: string | null;
}

function getInitialState(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return {
      accessToken: null,
      userId: null,
      email: null,
      role: null,
    };
  }

  const payload = parseJwt(token);

  return {
    accessToken: token,
    userId: payload.sub ?? null,
    email: payload.email ?? null,
    role: payload.role ?? null,
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState,
  reducers: {
    setCredentials(state, action: PayloadAction<string>) {
      const token = action.payload;
      const payload = parseJwt(token);

      state.accessToken = token;
      state.userId = payload.sub ?? null;
      state.email = payload.email ?? null;
      state.role = payload.role ?? null;

      localStorage.setItem(TOKEN_KEY, token);
    },
    logout(state) {
      state.accessToken = null;
      state.userId = null;
      state.email = null;
      state.role = null;

      localStorage.removeItem(TOKEN_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
