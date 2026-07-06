import { SpinnerIcon } from "./AccountIcons";

interface AccountLoadingViewProps {
  userInitial: string;
}

export function AccountLoadingView({ userInitial }: AccountLoadingViewProps) {
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

export function AccountErrorView({ message }: { message: string }) {
  return (
    <div className="account">
      <div className="account-inner account-error-page">
        <header className="account-hero">
          <h1 className="account-hero-title">Account Settings</h1>
        </header>
        <p className="account-error">{message}</p>
      </div>
    </div>
  );
}
