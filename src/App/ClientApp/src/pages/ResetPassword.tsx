import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../api/errors";
import { resetPassword } from "../api/auth";
import "./Auth.scss";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token, newPassword: password });
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err, "Could not reset password. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="auth">
        <div className="auth-card">
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-error">
            This reset link is invalid. Please request a new one.
          </p>
          <Link to="/forgot-password" className="auth-submit auth-submit--link">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">Choose a new password for your account.</p>

        {submitted ? (
          <div className="auth-success">
            <p>Your password has been reset successfully.</p>
            <Link to="/login" className="auth-submit auth-submit--link">
              Log in
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Reset password"}
            </button>
          </form>
        )}

        {!submitted && (
          <p className="auth-footer">
            Remember your password? <Link to="/login">Back to login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
