/**
 * Zustand Auth Store — Phase 6: Authentication
 *
 * Manages user authentication state with JWT tokens.
 * Uses the `persist` middleware to auto-save/restore auth state to/from localStorage.
 *
 * Key features:
 *   - Login/register with automatic token storage
 *   - Auto-refresh access token before expiry
 *   - Logout with token blacklisting
 *   - Profile management
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, RegisterFormData, LoginFormData } from "@/lib/types";
import { authApi } from "@/lib/api";

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  fetchProfile: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // -----------------------------------------------------------------------
      // LOGIN
      // -----------------------------------------------------------------------
      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(data);
          set({
            user: response.user,
            accessToken: response.tokens.access,
            refreshToken: response.tokens.refresh,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Login failed. Please try again.";
          set({
            isLoading: false,
            error: message,
          });
          throw err;
        }
      },

      // -----------------------------------------------------------------------
      // REGISTER
      // -----------------------------------------------------------------------
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          set({
            user: response.user,
            accessToken: response.tokens.access,
            refreshToken: response.tokens.refresh,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Registration failed. Please try again.";
          set({
            isLoading: false,
            error: message,
          });
          throw err;
        }
      },

      // -----------------------------------------------------------------------
      // LOGOUT
      // -----------------------------------------------------------------------
      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken);
          }
        } catch {
          // Ignore logout API errors — clear local state regardless
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // -----------------------------------------------------------------------
      // UPDATE PROFILE
      // -----------------------------------------------------------------------
      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await authApi.updateProfile(data);
          set({
            user: updatedUser,
            isLoading: false,
          });
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Profile update failed.";
          set({
            isLoading: false,
            error: message,
          });
          throw err;
        }
      },

      // -----------------------------------------------------------------------
      // FETCH PROFILE — refresh user data from server
      // -----------------------------------------------------------------------
      fetchProfile: async () => {
        try {
          const user = await authApi.getProfile();
          set({ user });
        } catch {
          // If fetching profile fails (e.g., token expired), log out
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      // -----------------------------------------------------------------------
      // ERROR MANAGEMENT
      // -----------------------------------------------------------------------
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "ecommerce-auth", // localStorage key
      // Don't persist loading/error state
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
