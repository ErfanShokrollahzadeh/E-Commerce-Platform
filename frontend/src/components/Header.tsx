/**
 * Global Site Header — visible on every page.
 *
 * Client component because it reads from the Zustand cart store
 * to display the animated cart badge count.
 */

"use client";

import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import CartDrawer from "./CartDrawer";
import styles from "./Header.module.css";

export default function Header() {
  const itemCount = useCartStore((s) => s.itemCount);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

  return (
    <>
      <header className={styles.header} id="site-header">
        <div className={styles.inner}>
          {/* Logo / Brand */}
          <Link href="/" className={styles.logo} id="header-logo">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={styles.logoIcon}
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className={styles.logoText}>ShopPlatform</span>
          </Link>

          {/* Navigation */}
          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="/" className={styles.navLink} id="nav-home">
              Home
            </Link>
            <Link href="/products" className={styles.navLink} id="nav-products">
              Products
            </Link>
            <Link href="/about" className={styles.navLink} id="nav-about">
              About Us
            </Link>
            <Link href="/contact" className={styles.navLink} id="nav-contact">
              Contact Us
            </Link>
          </nav>

          {/* Cart Button */}
          <button
            className={styles.cartButton}
            onClick={toggleDrawer}
            aria-label={`Shopping cart with ${itemCount} items`}
            id="header-cart-button"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className={styles.badge} id="cart-badge" key={itemCount}>
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
