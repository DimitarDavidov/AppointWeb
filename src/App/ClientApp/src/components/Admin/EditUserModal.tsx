import { useEffect, useState, type FormEvent } from "react";
import type { AdminUser, UpdateAdminUserRequest } from "../../types/admin";
import { UserRoles, type UserRole } from "../../constants/roles";
import "./EditUserModal.scss";

export interface EditUserModalProps {
  user: AdminUser | null;
  isSaving: boolean;
  error: string;
  onSave: (id: string, data: UpdateAdminUserRequest) => void;
  onClose: () => void;
}

function EditUserModal({
  user,
  isSaving,
  error,
  onSave,
  onClose,
}: EditUserModalProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>(UserRoles.Customer);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!user) return;

    setUsername(user.username);
    setEmail(user.email);
    setPhoneNumber(user.phoneNumber ?? "");
    setRole(user.role);
    setValidationError("");
  }, [user]);

  useEffect(() => {
    if (!user) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [user, isSaving, onClose]);

  if (!user) {
    return null;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedUsername.length < 3) {
      setValidationError("Username must be at least 3 characters.");
      return;
    }

    if (!trimmedEmail) {
      setValidationError("Email is required.");
      return;
    }

    setValidationError("");
    onSave(user.id, {
      username: trimmedUsername,
      email: trimmedEmail,
      phoneNumber: phoneNumber.trim() || null,
      role,
    });
  }

  const displayError = validationError || error;

  return (
    <div className="edit-user-root" role="presentation">
      <button
        type="button"
        className="edit-user-backdrop"
        aria-label="Close editor"
        disabled={isSaving}
        onClick={onClose}
      />

      <div
        className="edit-user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
      >
        <header className="edit-user-header">
          <h2 id="edit-user-title" className="edit-user-title">
            Edit user
          </h2>
          <p className="edit-user-subtitle">
            Update account details for <strong>{user.username}</strong>.
          </p>
        </header>

        <form className="edit-user-form" onSubmit={handleSubmit}>
          <div className="edit-user-field">
            <label htmlFor="edit-user-username">Username</label>
            <input
              id="edit-user-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              disabled={isSaving}
              autoComplete="username"
            />
          </div>

          <div className="edit-user-field">
            <label htmlFor="edit-user-email">Email</label>
            <input
              id="edit-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSaving}
              autoComplete="email"
            />
          </div>

          <div className="edit-user-field">
            <label htmlFor="edit-user-phone">Phone number</label>
            <input
              id="edit-user-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSaving}
              placeholder="Optional"
              autoComplete="tel"
            />
          </div>

          <div className="edit-user-field">
            <label htmlFor="edit-user-role">Role</label>
            <select
              id="edit-user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={isSaving}
            >
              <option value={UserRoles.Customer}>Customer</option>
              <option value={UserRoles.Provider}>Provider</option>
              <option value={UserRoles.Admin}>Admin</option>
            </select>
          </div>

          {displayError && (
            <p className="edit-user-error" role="alert">
              {displayError}
            </p>
          )}

          <div className="edit-user-actions">
            <button
              type="button"
              className="edit-user-btn edit-user-btn-secondary"
              disabled={isSaving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-user-btn edit-user-btn-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUserModal;
