/**
 * User Profile Page — Phase 6: Authentication
 *
 * Premium glassmorphism profile management page.
 * Displays user info and allows editing profile fields.
 */

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "./page.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, updateProfile, clearError } =
    useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Populate form with current user data
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setPostalCode(user.postal_code || "");
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage("");

    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        city,
        postal_code: postalCode,
      });
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      // Error is set in the store
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  /** Get user initials for avatar fallback */
  const getInitials = () => {
    const first = user.first_name?.[0] || "";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  return (
    <div className={styles.page}>
      {/* Animated background */}
      <div className={styles.bgGradient}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>

      <div className={styles.container}>
        {/* Profile header card */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarLarge}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarText}>{getInitials()}</span>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{user.full_name}</h1>
            <p className={styles.profileEmail}>{user.email}</p>
            <p className={styles.profileJoined}>
              Member since{" "}
              {new Date(user.date_joined).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Edit form card */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Personal Information
          </h2>

          {/* Success message */}
          {successMessage && (
            <div className={styles.successMessage}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className={styles.errorMessage}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} id="profile-form">
            {/* Name row */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="profile-firstname" className={styles.label}>
                  First name
                </label>
                <input
                  id="profile-firstname"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={styles.input}
                  placeholder="John"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="profile-lastname" className={styles.label}>
                  Last name
                </label>
                <input
                  id="profile-lastname"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={styles.input}
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className={styles.inputGroup}>
              <label htmlFor="profile-email" className={styles.label}>
                Email address
              </label>
              <input
                id="profile-email"
                type="email"
                value={user.email}
                disabled
                className={`${styles.input} ${styles.inputDisabled}`}
              />
              <span className={styles.inputHint}>
                Email cannot be changed
              </span>
            </div>

            {/* Phone */}
            <div className={styles.inputGroup}>
              <label htmlFor="profile-phone" className={styles.label}>
                Phone number
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={styles.input}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Shipping section */}
            <h3 className={styles.subTitle}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Default Shipping Address
            </h3>

            {/* Address */}
            <div className={styles.inputGroup}>
              <label htmlFor="profile-address" className={styles.label}>
                Street address
              </label>
              <input
                id="profile-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={styles.input}
                placeholder="123 Main Street, Apt 4B"
              />
            </div>

            {/* City & Postal */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="profile-city" className={styles.label}>
                  City
                </label>
                <input
                  id="profile-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={styles.input}
                  placeholder="New York"
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="profile-postal" className={styles.label}>
                  Postal code
                </label>
                <input
                  id="profile-postal"
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className={styles.input}
                  placeholder="10001"
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
              id="profile-save-btn"
            >
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
