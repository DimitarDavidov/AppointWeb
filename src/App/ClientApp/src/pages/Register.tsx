import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getErrorMessage, register } from "../api/auth";
import { UserRoles, type UserRole } from "../constants/roles";
import { setCredentials } from "../features/auth/authSlice";
import { useAppDispatch } from "../store/hooks";
import "./Auth.scss";

function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setAccountType] = useState<UserRole>(UserRoles.Customer);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

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
      const response = await register({
        username,
        email,
        password,
        phoneNumber,
        role: accountType,
      });
      dispatch(setCredentials(response));
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">
          {accountType === UserRoles.Provider
            ? "Sign up to offer services and manage appointments"
            : "Sign up to book appointments"}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <fieldset className="auth-role-picker">
            <legend className="auth-role-picker-label">I want to</legend>
            <div className="auth-role-picker-options">
              <label
                className={`auth-role-option${accountType === UserRoles.Customer ? " auth-role-option--active" : ""}`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={UserRoles.Customer}
                  checked={accountType === UserRoles.Customer}
                  onChange={() => setAccountType(UserRoles.Customer)}
                />
                <span className="auth-role-option-title">Book appointments</span>
                <span className="auth-role-option-desc">Customer account</span>
              </label>
              <label
                className={`auth-role-option${accountType === UserRoles.Provider ? " auth-role-option--active" : ""}`}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={UserRoles.Provider}
                  checked={accountType === UserRoles.Provider}
                  onChange={() => setAccountType(UserRoles.Provider)}
                />
                <span className="auth-role-option-title">Offer services</span>
                <span className="auth-role-option-desc">Provider account</span>
              </label>
            </div>
          </fieldset>

          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="phoneNumber">Phone number</label>
            <input
              id="phoneNumber"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
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
            <label htmlFor="confirmPassword">Confirm password</label>
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
            {isSubmitting ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
