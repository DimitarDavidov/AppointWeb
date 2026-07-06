import { CheckCircleIcon } from "../components/Account/AccountIcons";
import { AccountFieldsSection } from "../components/Account/AccountFieldsSection";
import {
  AccountErrorView,
  AccountLoadingView,
} from "../components/Account/AccountPageStates";
import { DeleteAccountDialog } from "../components/Account/DeleteAccountDialog";
import { useAccountSettings } from "../hooks/useAccountSettings";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { formatRoleLabel } from "../constants/roles";
import "./Account.scss";

function Account() {
  const settings = useAccountSettings();
  const {
    username,
    role,
    isLoading,
    loadError,
    message,
    showDeleteDialog,
    deletePassword,
    setDeletePassword,
    deleteError,
    isDeletingAccount,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteAccount,
  } = settings;

  const displayName = capitalizeFirstLetter(username ?? "User");
  const userInitial = displayName.charAt(0).toUpperCase();

  if (isLoading) {
    return <AccountLoadingView userInitial={userInitial} />;
  }

  if (loadError) {
    return <AccountErrorView message={loadError} />;
  }

  return (
    <div className="account">
      <DeleteAccountDialog
        open={showDeleteDialog}
        role={role}
        password={deletePassword}
        error={deleteError}
        isDeleting={isDeletingAccount}
        onPasswordChange={setDeletePassword}
        onConfirm={confirmDeleteAccount}
        onClose={closeDeleteDialog}
      />

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

        <AccountFieldsSection settings={settings} />

        <p className="account-delete-wrap">
          <button type="button" onClick={openDeleteDialog}>
            Delete account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Account;
