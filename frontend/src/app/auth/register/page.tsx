/**
 * Register Page — Phase 6: Authentication
 *
 * Premium glassmorphism registration form with social signup buttons
 * and a password strength indicator.
 */

"use client";

import { useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import styles from "../login/page.module.css";

/** Calculate password strength from 0-4. */
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  return {
    score,
    label: password.length === 0 ? "" : labels[score],
    color: colors[score],
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== passwordConfirm) {
      useAuthStore.getState().setError("Passwords do not match.");
      return;
    }

    try {
      await register({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: passwordConfirm,
      });
      router.push("/");
    } catch {
      // Error is already set in the store
    }
  };

  return (
    <div className={styles.page}>
      {/* Animated background */}
      <div className={styles.bgGradient}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.container}>
        {/* Glass card */}
        <div className={styles.card}>
          {/* Logo & heading */}
          <div className={styles.header}>
            <div className={styles.logoWrap}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={styles.logoIcon}
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>
              Join us and start your premium shopping experience
            </p>
          </div>

          {/* Social signup buttons */}
          <div className={styles.socialButtons}>
            <button
              type="button"
              className={`${styles.socialBtn} ${styles.googleBtn}`}
              id="register-google-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>

            <button
              type="button"
              className={`${styles.socialBtn} ${styles.facebookBtn}`}
              id="register-facebook-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Sign up with Facebook</span>
            </button>
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or sign up with email</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorMessage} id="register-error">
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

          {/* Register form */}
          <form
            onSubmit={handleSubmit}
            className={styles.form}
            id="register-form"
          >
            {/* Name row */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="register-firstname" className={styles.label}>
                  First name
                </label>
                <div className={styles.inputWrap}>
                  <svg
                    className={styles.inputIcon}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="register-firstname"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                    autoComplete="given-name"
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="register-lastname" className={styles.label}>
                  Last name
                </label>
                <div className={styles.inputWrap}>
                  <svg
                    className={styles.inputIcon}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="register-lastname"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    autoComplete="family-name"
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className={styles.inputGroup}>
              <label htmlFor="register-email" className={styles.label}>
                Email address
              </label>
              <div className={styles.inputWrap}>
                <svg
                  className={styles.inputIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className={styles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
              <label htmlFor="register-password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrap}>
                <svg
                  className={styles.inputIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={styles.input}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <>
                  <div className={styles.strengthBar}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`${styles.strengthSegment} ${
                          i < strength.score ? styles.active : ""
                        }`}
                        style={
                          i < strength.score
                            ? ({ "--strength-color": strength.color } as React.CSSProperties)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                  <span
                    className={styles.strengthLabel}
                    style={
                      { "--strength-color": strength.color } as React.CSSProperties
                    }
                  >
                    {strength.label}
                  </span>
                </>
              )}
            </div>

            {/* Confirm password */}
            <div className={styles.inputGroup}>
              <label htmlFor="register-password-confirm" className={styles.label}>
                Confirm password
              </label>
              <div className={styles.inputWrap}>
                <svg
                  className={styles.inputIcon}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  id="register-password-confirm"
                  type={showPassword ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className={styles.input}
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
              id="register-submit-btn"
            >
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className={styles.switchText}>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className={styles.switchLink}
              id="goto-login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
