import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  EditIcon,
  EmailIcon,
  PasswordIcon,
  PhoneIcon,
  SpinnerIcon,
  UsernameIcon,
} from "../components/Account/AccountIcons";
import {
  changePassword,
  getAccountProfile,
  updateEmail,
  updatePhoneNumber,
  updateUsername,
} from "../api/account";
import { getErrorMessage } from "../api/auth";
import { setCredentials } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { formatRoleLabel } from "../constants/roles";
import "./Account.scss";

type EditableField = "email" | "username" | "password" | "phoneNumber";
type FieldVariant = "email" | "username" | "password" | "phone";

const MASKED_PASSWORD = "••••••••";

interface AccountFieldProps {
  variant: FieldVariant;
  label: string;
  value: string;
  icon: ReactNode;
  index: number;
  masked?: boolean;
  empty?: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  editForm: ReactNode;
}

function AccountField({
  variant,
  label,
  value,
  icon,
  index,
  masked,
  empty,
  isEditing,
  onEdit,
  onCancel,
  editForm,
}: AccountFieldProps) {
  return (
    <div
      className={`account-field account-field--${variant}${isEditing ? " account-field--editing" : ""}`}
      style={{ animationDelay: `${0.08 + index * 0.07}s` }}
    >
      <div className="account-field-row">
        <div className="account-field-icon-wrap">{icon}</div>
        <div className="account-field-body">
          <span className="account-field-label">{label}</span>
          {!isEditing && (
            <span
              className={`account-field-value${masked ? " account-field-value--masked" : ""}${empty ? " account-field-value--empty" : ""}`}
            >
              {value}
            </span>
          )}
        </div>
        {!isEditing && (
          <button
            type="button"
            className="account-field-change"
            onClick={onEdit}
          >
            <EditIcon />
            Change
          </button>
        )}
      </div>

      {isEditing && (
        <div className="account-field-edit">
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
        </div>
      )}
    </div>
  );
}

interface InputWithIconProps {
  id: string;
  type: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}

function InputWithIcon({
  id,
  type,
  icon,
  value,
  onChange,
  disabled,
  placeholder,
  required,
  minLength,
  maxLength,
  autoComplete,
}: InputWithIconProps) {
  return (
    <div className="account-field-input-wrap">
      {icon}
      <input
        id={id}
        className="account-field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function SaveButton({
  isSaving,
  label = "Save",
}: {
  isSaving: boolean;
  label?: string;
}) {
  return (
    <button type="submit" className="account-field-save" disabled={isSaving}>
      {isSaving ? (
        <>
          <SpinnerIcon className="account-field-spinner" />
          Saving...
        </>
      ) : (
        label
      )}
    </button>
  );
}

function Account() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { accessToken, email, username, role } = useAppSelector(
    (state) => state.auth
  );

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const displayName = capitalizeFirstLetter(username ?? "User");
  const userInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setLoadError("");

      try {
        const profile = await getAccountProfile();
        if (cancelled) return;

        setPhoneNumber(profile.phoneNumber ?? "");
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            getErrorMessage(err, "Failed to load account details.")
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

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

  async function handleSaveEmail(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    setIsSavingEmail(true);
    setError("");

    try {
      const response = await updateEmail(trimmed);
      dispatch(setCredentials(response));
      setEditingField(null);
      setMessage("Email updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update email."));
    } finally {
      setIsSavingEmail(false);
    }
  }

  async function handleSaveUsername(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setIsSavingUsername(true);
    setError("");

    try {
      const response = await updateUsername(trimmed);
      dispatch(setCredentials(response));
      setEditingField(null);
      setMessage("Username updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update username."));
    } finally {
      setIsSavingUsername(false);
    }
  }

  async function handleSavePassword(e: FormEvent) {
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

    setIsSavingPassword(true);
    setError("");

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditingField(null);
      setMessage("Password updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update password."));
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleSavePhone(e: FormEvent) {
    e.preventDefault();
    const trimmed = draftValue.trim();

    setIsSavingPhone(true);
    setError("");

    try {
      const profile = await updatePhoneNumber(trimmed);
      setPhoneNumber(profile.phoneNumber ?? "");
      setEditingField(null);
      setMessage("Phone number updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update phone number."));
    } finally {
      setIsSavingPhone(false);
    }
  }

  if (isLoading) {
    return (
      <div className="account">
        <div className="account-inner">
          <header className="account-hero">
            <div className="account-hero-avatar">{userInitial}</div>
            <h1 className="account-hero-title">Account Settings</h1>
            <p className="account-hero-subtitle">Loading your profile...</p>
          </header>
          <div className="account-loading">
            <SpinnerIcon className="account-loading-spinner" />
            <p className="account-loading-text">Fetching your details</p>
          </div>
          <div className="account-skeleton" aria-hidden="true">
            <div className="account-skeleton-row" />
            <div className="account-skeleton-row" />
            <div className="account-skeleton-row" />
            <div className="account-skeleton-row" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="account">
        <div className="account-inner account-error-page">
          <header className="account-hero">
            <h1 className="account-hero-title">Account Settings</h1>
          </header>
          <p className="account-error">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="account">
      <div className="account-inner">
        <header className="account-hero">
          <div className="account-hero-avatar" aria-hidden="true">
            {userInitial}
          </div>
          <h1 className="account-hero-title">Account Settings</h1>
          <p className="account-hero-subtitle">
            Hi {displayName} · {formatRoleLabel(role)} — manage your profile
            and keep your information up to date.
          </p>
        </header>

        {message && (
          <div className="account-toast" role="status">
            <CheckCircleIcon />
            <span>{message}</span>
          </div>
        )}

        <div className="account-card">
          <AccountField
            variant="email"
            label="Email"
            value={email ?? ""}
            icon={<EmailIcon />}
            index={0}
            isEditing={editingField === "email"}
            onEdit={() => startEditing("email")}
            onCancel={cancelEditing}
            editForm={
              <form className="account-field-form" onSubmit={handleSaveEmail}>
                <InputWithIcon
                  id="account-email"
                  type="email"
                  icon={<EmailIcon />}
                  value={draftValue}
                  onChange={setDraftValue}
                  disabled={isSavingEmail}
                  autoComplete="email"
                  required
                />
                {error && editingField === "email" && (
                  <p className="account-error">{error}</p>
                )}
                <SaveButton isSaving={isSavingEmail} />
              </form>
            }
          />

          <AccountField
            variant="username"
            label="Username"
            value={username ?? ""}
            icon={<UsernameIcon />}
            index={1}
            isEditing={editingField === "username"}
            onEdit={() => startEditing("username")}
            onCancel={cancelEditing}
            editForm={
              <form
                className="account-field-form"
                onSubmit={handleSaveUsername}
              >
                <InputWithIcon
                  id="account-username"
                  type="text"
                  icon={<UsernameIcon />}
                  value={draftValue}
                  onChange={setDraftValue}
                  disabled={isSavingUsername}
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={50}
                />
                {error && editingField === "username" && (
                  <p className="account-error">{error}</p>
                )}
                <SaveButton isSaving={isSavingUsername} />
              </form>
            }
          />

          <AccountField
            variant="password"
            label="Password"
            value={MASKED_PASSWORD}
            icon={<PasswordIcon />}
            index={2}
            masked
            isEditing={editingField === "password"}
            onEdit={() => startEditing("password")}
            onCancel={cancelEditing}
            editForm={
              <form
                className="account-field-form"
                onSubmit={handleSavePassword}
              >
                <InputWithIcon
                  id="account-current-password"
                  type="password"
                  icon={<PasswordIcon />}
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  disabled={isSavingPassword}
                  placeholder="Current password"
                  autoComplete="current-password"
                  required
                />
                <InputWithIcon
                  id="account-new-password"
                  type="password"
                  icon={<PasswordIcon />}
                  value={newPassword}
                  onChange={setNewPassword}
                  disabled={isSavingPassword}
                  placeholder="New password"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                <InputWithIcon
                  id="account-confirm-password"
                  type="password"
                  icon={<PasswordIcon />}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={isSavingPassword}
                  placeholder="Confirm new password"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
                {error && editingField === "password" && (
                  <p className="account-error">{error}</p>
                )}
                <SaveButton isSaving={isSavingPassword} />
              </form>
            }
          />

          <AccountField
            variant="phone"
            label="Phone number"
            value={phoneNumber || "Not set"}
            icon={<PhoneIcon />}
            index={3}
            empty={!phoneNumber}
            isEditing={editingField === "phoneNumber"}
            onEdit={() => startEditing("phoneNumber")}
            onCancel={cancelEditing}
            editForm={
              <form className="account-field-form" onSubmit={handleSavePhone}>
                <InputWithIcon
                  id="account-phone"
                  type="tel"
                  icon={<PhoneIcon />}
                  value={draftValue}
                  onChange={setDraftValue}
                  disabled={isSavingPhone}
                  placeholder="Optional"
                  autoComplete="tel"
                />
                {error && editingField === "phoneNumber" && (
                  <p className="account-error">{error}</p>
                )}
                <SaveButton isSaving={isSavingPhone} />
              </form>
            }
          />
        </div>
      </div>
    </div>
  );
}

export default Account;
