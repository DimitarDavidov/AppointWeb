import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse } from "../../types/auth";
import { parseJwt } from "../../utils/jwt";

const TOKEN_KEY = "accessToken";
const AUTH_USER_KEY = "authUser";

export interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
  username: string | null;
  role: string | null;
}

function loadStoredUser(): Pick<
  AuthState,
  "username" | "email" | "role" | "userId"
> | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Pick<
      AuthState,
      "username" | "email" | "role" | "userId"
    >;
  } catch {
    return null;
  }
}

function saveStoredUser(
  user: Pick<AuthState, "username" | "email" | "role" | "userId">
): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function getInitialState(): AuthState {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = loadStoredUser();

  if (!token) {
    return {
      accessToken: null,
      userId: null,
      email: null,
      username: null,
      role: null,
    };
  }

  const payload = parseJwt(token);

  return {
    accessToken: token,
    userId: storedUser?.userId ?? payload.sub ?? null,
    email: storedUser?.email ?? payload.email ?? null,
    username: storedUser?.username ?? payload.username ?? null,
    role: storedUser?.role ?? payload.role ?? null,
  };
}

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthResponse>) {
      const { accessToken, username, email, role } = action.payload;
      const payload = parseJwt(accessToken);

      state.accessToken = accessToken;
      state.userId = payload.sub ?? null;
      state.email = email;
      state.username = username;
      state.role = role;

      localStorage.setItem(TOKEN_KEY, accessToken);
      saveStoredUser({
        userId: payload.sub ?? null,
        username,
        email,
        role,
      });
    },
    logout(state) {
      state.accessToken = null;
      state.userId = null;
      state.email = null;
      state.username = null;
      state.role = null;

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    },
    updateProfile(
      state,
      action: PayloadAction<
        Partial<Pick<AuthState, "username" | "email">>
      >
    ) {
      if (action.payload.username !== undefined) {
        state.username = action.payload.username;
      }
      if (action.payload.email !== undefined) {
        state.email = action.payload.email;
      }

      saveStoredUser({
        userId: state.userId,
        username: state.username,
        email: state.email,
        role: state.role,
      });
    },
  },
});

export const { setCredentials, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
