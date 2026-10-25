import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser, LoginResponseDTO } from "../../api/auth";

export type AsyncStatus =
  | "idle"
  | "pending"
  | "succeeded"
  | "failed";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AsyncStatus;
  erro: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: "idle",
  erro: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    loginStarted(state) {
      state.status = "pending";
      state.erro = null;
    },

   loginSucceeded(state, action: PayloadAction<LoginResponseDTO>) {
  state.user = action.payload.user;
  state.accessToken = action.payload.token;
  state.status = "succeeded";
  state.erro = null;
},

    restoreToken(
      state,
      action: PayloadAction<string>
    ) {
      state.user = null;
      state.accessToken = action.payload;
      state.status = "pending";
      state.erro = null;
    },

    sessionVerified(
      state,
      action: PayloadAction<AuthUser>
    ) {
      state.user = action.payload;
      state.status = "succeeded";
      state.erro = null;
    },

    loginFailed(
      state,
      action: PayloadAction<string>
    ) {
      state.user = null;
      state.accessToken = null;
      state.status = "failed";
      state.erro = action.payload;
    },

    clearAuthError(state) {
      state.erro = null;
    },

    logout() {
      return { ...initialState };
    },
  },
});

export const {
  loginStarted,
  loginSucceeded,
  restoreToken,
  sessionVerified,
  loginFailed,
  clearAuthError,
  logout,
} = authSlice.actions;

export default authSlice.reducer;