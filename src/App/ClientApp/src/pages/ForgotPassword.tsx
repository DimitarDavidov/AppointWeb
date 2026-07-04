import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import "./Auth.scss";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // Frontend only — backend reset flow not wired yet
    await new Promise((resolve) => setTimeout(resolve, 600));

    setSubmitted(true);
    setIsSubmitting(false);
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <h1 className="auth-title">Forgot password</h1>
        <p className="auth-subtitle">
          Enter your email and we&apos;ll send you reset instructions.
        </p>

        {submitted ? (
          <div className="auth-success">
            <p>
              If an account exists for <strong>{email}</strong>, you will receive
              password reset instructions shortly.
            </p>
            <Link to="/login" className="auth-submit auth-submit--link">
              Back to login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Enter your email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
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

export default ForgotPassword;
