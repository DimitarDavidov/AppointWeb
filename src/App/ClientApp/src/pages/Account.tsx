import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import "./Account.scss";

type EditableField = "email" | "username" | "password" | "phoneNumber";

const MASKED_PASSWORD = "••••••••";

function getPhoneStorageKey(userId: string) {
  return `accountPhone_${userId}`;
}

interface AccountFieldProps {
  label: string;
  value: string;
  masked?: boolean;
  empty?: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  editForm: ReactNode;
}

function AccountField({
  label,
  value,
  masked,
  empty,
  isEditing,
  onEdit,
  onCancel,
  editForm,
}: AccountFieldProps) {
  return (
    <div className="account-field">
      {isEditing ? (
        <>
          <span className="account-field-label">{label}</span>
          {editForm}
          <div className="account-field-actions">
            <button
              type="button"
              className="account-field-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="account-field-header">
          <div className="account-field-info">
            <span className="account-field-label">{label}</span>
            <span
              className={`account-field-value${masked ? " account-field-value--masked" : ""}${empty ? " account-field-value--empty" : ""}`}
            >
              {value}
            </span>
          </div>
          <button
            type="button"
            className="account-field-change"
            onClick={onEdit}
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}

function Account() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { accessToken, userId, email, username } = useAppSelector(
    (state) => state.auth
  );

  const [phoneNumber, setPhoneNumber] = useState("");
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!userId) return;

    const stored = localStorage.getItem(getPhoneStorageKey(userId));
    if (stored) {
      setPhoneNumber(stored);
    }
  }, [userId]);

  if (!accessToken) {
    return null;
  }

  function startEditing(field: EditableField) {
    setEditingField(field);
    setError("");
    setMessage("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    if (field === "email") setDraftValue(email ?? "");
    else if (field === "username") setDraftValue(username ?? "");
    else if (field === "phoneNumber") setDraftValue(phoneNumber);
  }

  function cancelEditing() {
    setEditingField(null);
    setDraftValue("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  function handleSaveEmail(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    dispatch(updateProfile({ email: trimmed }));
    setEditingField(null);
    setMessage("Email updated.");
  }

  function handleSaveUsername(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    dispatch(updateProfile({ username: trimmed }));
    setEditingField(null);
    setMessage("Username updated.");
  }

  function handleSavePassword(e: FormEvent) {
    e.preventDefault();

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setEditingField(null);
    setMessage("Password updated.");
  }

  function handleSavePhone(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    setPhoneNumber(trimmed);

    if (userId) {
      if (trimmed) {
        localStorage.setItem(getPhoneStorageKey(userId), trimmed);
      } else {
        localStorage.removeItem(getPhoneStorageKey(userId));
      }
    }

    setEditingField(null);
    setMessage("Phone number updated.");
  }

  return (
    <div className="account">
      <h1 className="account-title">Account</h1>
      <p className="account-subtitle">Manage your profile details</p>

      {message && <p className="account-message">{message}</p>}

      <div className="account-card">
        <AccountField
          label="Email"
          value={email ?? ""}
          isEditing={editingField === "email"}
          onEdit={() => startEditing("email")}
          onCancel={cancelEditing}
          editForm={
            <form className="account-field-form" onSubmit={handleSaveEmail}>
              <input
                id="account-email"
                className="account-field-input"
                type="email"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                required
                autoComplete="email"
              />
              {error && editingField === "email" && (
                <p className="account-error">{error}</p>
              )}
              <button type="submit" className="account-field-save">
                Save
              </button>
            </form>
          }
        />

        <AccountField
          label="Username"
          value={username ?? ""}
          isEditing={editingField === "username"}
          onEdit={() => startEditing("username")}
          onCancel={cancelEditing}
          editForm={
            <form className="account-field-form" onSubmit={handleSaveUsername}>
              <input
                id="account-username"
                className="account-field-input"
                type="text"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
              />
              {error && editingField === "username" && (
                <p className="account-error">{error}</p>
              )}
              <button type="submit" className="account-field-save">
                Save
              </button>
            </form>
          }
        />

        <AccountField
          label="Password"
          value={MASKED_PASSWORD}
          masked
          isEditing={editingField === "password"}
          onEdit={() => startEditing("password")}
          onCancel={cancelEditing}
          editForm={
            <form className="account-field-form" onSubmit={handleSavePassword}>
              <input
                id="account-current-password"
                className="account-field-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
                autoComplete="current-password"
              />
              <input
                id="account-new-password"
                className="account-field-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <input
                id="account-confirm-password"
                className="account-field-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                minLength={6}
                autoComplete="new-password"
              />
              {error && editingField === "password" && (
                <p className="account-error">{error}</p>
              )}
              <button type="submit" className="account-field-save">
                Save
              </button>
            </form>
          }
        />

        <AccountField
          label="Phone number"
          value={phoneNumber || "Not set"}
          empty={!phoneNumber}
          isEditing={editingField === "phoneNumber"}
          onEdit={() => startEditing("phoneNumber")}
          onCancel={cancelEditing}
          editForm={
            <form className="account-field-form" onSubmit={handleSavePhone}>
              <input
                id="account-phone"
                className="account-field-input"
                type="tel"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                placeholder="Optional"
                autoComplete="tel"
              />
              {error && editingField === "phoneNumber" && (
                <p className="account-error">{error}</p>
              )}
              <button type="submit" className="account-field-save">
                Save
              </button>
            </form>
          }
        />
      </div>
    </div>
  );
}

export default Account;
