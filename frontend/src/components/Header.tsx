/**
 * Global Site Header — visible on every page.
 *
 * Client component because it reads from the Zustand cart store
 * to display the animated cart badge count, and from the auth store
 * to show login/user menu state.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import CartDrawer from "./CartDrawer";
import styles from "./Header.module.css";

export default function Header() {
  const router = useRouter();
  const itemCount = useCartStore((s) => s.itemCount);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    router.push("/");
  };

  /** Get user initials for avatar fallback */
  const getInitials = () => {
    if (!user) return "?";
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

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

          {/* Right side actions */}
          <div className={styles.actions}>
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

            {/* Auth: Sign In button OR User menu */}
            {isAuthenticated && user ? (
              <div className={styles.userMenu} ref={menuRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="User menu"
                  id="user-menu-button"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.full_name}
                      className={styles.avatarImg}
                    />
                  ) : (
                    <span className={styles.avatarInitials}>
                      {getInitials()}
                    </span>
                  )}
                  <svg
                    className={`${styles.chevron} ${isMenuOpen ? styles.chevronOpen : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown */}
                {isMenuOpen && (
                  <div className={styles.dropdown} id="user-dropdown">
                    <div className={styles.dropdownHeader}>
                      <span className={styles.dropdownName}>
                        {user.full_name}
                      </span>
                      <span className={styles.dropdownEmail}>
                        {user.email}
                      </span>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link
                      href="/account/profile"
                      className={styles.dropdownItem}
                      onClick={() => setIsMenuOpen(false)}
                      id="menu-profile"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>My Profile</span>
                    </Link>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.logoutItem}`}
                      onClick={handleLogout}
                      id="menu-logout"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className={styles.signInBtn}
                id="header-signin-btn"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
