/**
 * Cart Drawer — Slide-in sidebar showing cart contents.
 *
 * Opens from the right when the cart icon is clicked in the Header.
 * Shows items with quantity controls, subtotals, and a "Proceed to Checkout" CTA.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { getImageUrl } from "@/lib/utils";
import styles from "./CartDrawer.module.css";

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) closeDrawer();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isDrawerOpen, closeDrawer]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`${styles.overlay} ${isDrawerOpen ? styles.overlayVisible : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ""}`}
        aria-label="Shopping cart"
        id="cart-drawer"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            Your Cart
            {itemCount > 0 && (
              <span className={styles.drawerCount}>({itemCount})</span>
            )}
          </h2>
          <button
            className={styles.closeBtn}
            onClick={closeDrawer}
            aria-label="Close cart"
            id="close-cart-drawer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>Your cart is empty</p>
            <Link
              href="/products"
              className={styles.shopLink}
              onClick={closeDrawer}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.itemList}>
              {items.map((item) => (
                <div key={item.productId} className={styles.item} id={`cart-item-${item.productId}`}>
                  {/* Image */}
                  <div className={styles.itemImage}>
                    {item.image ? (
                      <Image
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className={styles.img}
                      />
                    ) : (
                      <div className={styles.imgPlaceholder}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className={styles.itemDetails}>
                    <Link
                      href={`/products/${item.slug}`}
                      className={styles.itemName}
                      onClick={closeDrawer}
                    >
                      {item.name}
                    </Link>
                    <span className={styles.itemPrice}>
                      {formatPrice(item.price)}
                    </span>

                    {/* Quantity controls */}
                    <div className={styles.qtyRow}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Line total & remove */}
                  <div className={styles.itemEnd}>
                    <span className={styles.lineTotal}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={styles.drawerFooter}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Subtotal</span>
                <span className={styles.totalValue}>{formatPrice(total)}</span>
              </div>
              <Link
                href="/checkout"
                className={styles.checkoutBtn}
                onClick={closeDrawer}
                id="proceed-to-checkout"
              >
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
