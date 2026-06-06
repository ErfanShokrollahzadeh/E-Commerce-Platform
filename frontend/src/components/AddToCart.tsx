/**
 * AddToCart — Client Component
 *
 * This MUST be a client component because:
 *   1. It uses React state (quantity selector)
 *   2. It uses Zustand cart store
 *   3. It handles user interactions (click events)
 *
 * The parent product page is a Server Component (required for ISR).
 * This component is the "interactive island" within the static page.
 */

"use client";

import { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import styles from "./AddToCart.module.css";

interface AddToCartProps {
  productId: number;
  productName: string;
  productSlug: string;
  price: number;
  inStock: boolean;
  image?: string;
}

export default function AddToCart({
  productId,
  productName,
  productSlug,
  price,
  inStock,
  image,
}: AddToCartProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      productId,
      name: productName,
      slug: productSlug,
      price,
      quantity,
      image,
    });

    // Show success feedback and open cart drawer
    setIsAdded(true);
    openDrawer();
    setTimeout(() => setIsAdded(false), 2000);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  return (
    <div className={styles.wrapper}>
      {/* Quantity Selector */}
      <div className={styles.quantitySelector}>
        <span className={styles.quantityLabel}>Quantity</span>
        <div className={styles.quantityControls}>
          <button
            className={styles.quantityBtn}
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            id="decrease-quantity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className={styles.quantityValue} id="quantity-display">{quantity}</span>
          <button
            className={styles.quantityBtn}
            onClick={incrementQuantity}
            aria-label="Increase quantity"
            id="increase-quantity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        className={`${styles.addButton} ${isAdded ? styles.added : ""}`}
        onClick={handleAddToCart}
        disabled={!inStock}
        id="add-to-cart-button"
      >
        {!inStock ? (
          "Out of Stock"
        ) : isAdded ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Added to Cart!
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Add to Cart — ${(price * quantity).toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
}
