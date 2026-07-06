import {
  EmailIcon,
  PasswordIcon,
  PhoneIcon,
  UsernameIcon,
} from "./AccountIcons";
import {
  AccountField,
  InputWithIcon,
  SaveButton,
} from "./AccountField";
import type { useAccountSettings } from "../../hooks/useAccountSettings";

const MASKED_PASSWORD = "••••••••";

type AccountSettings = ReturnType<typeof useAccountSettings>;

interface AccountFieldsSectionProps {
  settings: AccountSettings;
}

export function AccountFieldsSection({ settings }: AccountFieldsSectionProps) {
  const {
    email,
    username,
    phoneNumber,
    draftValue,
    setDraftValue,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isSavingEmail,
    isSavingUsername,
    isSavingPassword,
    isSavingPhone,
    editingField,
    startEditing,
    cancelEditing,
    handleSaveEmail,
    handleSaveUsername,
    handleSavePassword,
    handleSavePhone,
  } = settings;

  return (
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
          <form className="account-field-form" onSubmit={handleSaveUsername}>
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
          <form className="account-field-form" onSubmit={handleSavePassword}>
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
  );
}
