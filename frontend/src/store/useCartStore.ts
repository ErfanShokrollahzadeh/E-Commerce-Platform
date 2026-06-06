/**
 * Zustand Cart Store — Phase 4: State Management
 *
 * Replaces React Context with Zustand for simpler, more performant cart state.
 * Uses the `persist` middleware to auto-save/restore cart to/from localStorage.
 *
 * Why Zustand over Redux Toolkit?
 *   - Zero boilerplate (no actions, reducers, selectors, providers)
 *   - Built-in localStorage persistence middleware
 *   - Works without wrapping the app in a Provider component
 *   - Tiny bundle size (~1KB vs ~10KB for RTK)
 */

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface CartState {
  // State
  items: CartItem[];
  total: number;
  itemCount: number;
  isDrawerOpen: boolean;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// =============================================================================
// STORE
// =============================================================================

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      // Initial state
      items: [],
      total: 0,
      itemCount: 0,
      isDrawerOpen: false,

      // -----------------------------------------------------------------------
      // ADD ITEM — merges quantity if product already in cart
      // -----------------------------------------------------------------------
      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === item.productId
          );

          let newItems: CartItem[];
          if (existingIndex >= 0) {
            // Merge quantity
            newItems = state.items.map((i, idx) =>
              idx === existingIndex
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            );
          } else {
            newItems = [...state.items, item];
          }

          return {
            items: newItems,
            total: calculateTotal(newItems),
            itemCount: calculateItemCount(newItems),
          };
        }),

      // -----------------------------------------------------------------------
      // REMOVE ITEM — removes product entirely from cart
      // -----------------------------------------------------------------------
      removeItem: (productId) =>
        set((state) => {
          const newItems = state.items.filter(
            (i) => i.productId !== productId
          );
          return {
            items: newItems,
            total: calculateTotal(newItems),
            itemCount: calculateItemCount(newItems),
          };
        }),

      // -----------------------------------------------------------------------
      // UPDATE QUANTITY — sets exact quantity; removes if <= 0
      // -----------------------------------------------------------------------
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter(
              (i) => i.productId !== productId
            );
            return {
              items: newItems,
              total: calculateTotal(newItems),
              itemCount: calculateItemCount(newItems),
            };
          }

          const newItems = state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          );
          return {
            items: newItems,
            total: calculateTotal(newItems),
            itemCount: calculateItemCount(newItems),
          };
        }),

      // -----------------------------------------------------------------------
      // CLEAR CART
      // -----------------------------------------------------------------------
      clearCart: () =>
        set({
          items: [],
          total: 0,
          itemCount: 0,
        }),

      // -----------------------------------------------------------------------
      // DRAWER CONTROLS
      // -----------------------------------------------------------------------
      toggleDrawer: () =>
        set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "ecommerce-cart", // localStorage key
      // Don't persist the drawer open state — always start closed
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        itemCount: state.itemCount,
      }),
    }
  )
);
