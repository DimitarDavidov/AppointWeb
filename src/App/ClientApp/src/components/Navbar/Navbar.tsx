import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import { logout } from "../../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { capitalizeFirstLetter } from "../../utils/formatDisplayName";
import {
  AccountIcon,
  AdminIcon,
  AppointmentsIcon,
  LoginIcon,
  LogoutIcon,
  RegisterIcon,
} from "./NavIcons";
import "./Navbar.scss";

function MobileNavLink({
  to,
  label,
  icon,
  accent,
  onClick,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      className={`navbar-mobile-link${accent ? " navbar-mobile-link--accent" : ""}`}
      onClick={onClick}
    >
      <span className="navbar-mobile-link-label">{label}</span>
      <span className="navbar-mobile-link-icon">{icon}</span>
    </Link>
  );
}

function DesktopDropdownLink({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link to={to} className="navbar-dropdown-item">
      <span className="navbar-dropdown-item-icon">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, username, role } = useAppSelector(
    (state) => state.auth
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isLoggedIn = !!accessToken;
  const isAdmin = role === "Admin";
  const displayName = capitalizeFirstLetter(username ?? "User");
  const userInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  function handleLogout() {
    dispatch(logout());
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    navigate("/");
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((open) => !open);
    setUserMenuOpen(false);
  }

  function toggleUserMenu() {
    setUserMenuOpen((open) => !open);
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
        <img src={logo} alt="AppointWeb" className="navbar-logo" />
      </Link>

      <div className="navbar-actions navbar-actions--desktop">
        {isLoggedIn ? (
          <div
            className={`navbar-user-menu${userMenuOpen ? " is-open" : ""}`}
          >
            <button
              type="button"
              className="navbar-user-trigger"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              onClick={toggleUserMenu}
            >
              <span className="navbar-user-avatar" aria-hidden="true">
                {userInitial}
              </span>
              <span className="navbar-user-name">{displayName}</span>
              <span className="navbar-user-chevron" aria-hidden="true" />
            </button>

            <div className="navbar-dropdown">
              <div className="navbar-dropdown-panel">
                {isAdmin && (
                  <DesktopDropdownLink
                    to="/admin"
                    label="Admin Panel"
                    icon={<AdminIcon />}
                  />
                )}
                <DesktopDropdownLink
                  to="/account"
                  label="Account"
                  icon={<AccountIcon />}
                />
                <DesktopDropdownLink
                  to="/appointments"
                  label="Appointments"
                  icon={<AppointmentsIcon />}
                />
                <button
                  type="button"
                  className="navbar-dropdown-logout"
                  onClick={handleLogout}
                >
                  <span className="navbar-dropdown-item-icon navbar-dropdown-item-icon--danger">
                    <LogoutIcon />
                  </span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="navbar-link navbar-link--ghost">
              <LoginIcon />
              <span>Login</span>
            </Link>
            <Link to="/register" className="navbar-link navbar-link--primary">
              <RegisterIcon />
              <span>Register</span>
            </Link>
          </>
        )}
      </div>

      <button
        type="button"
        className={`navbar-toggle${mobileMenuOpen ? " is-active" : ""}`}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="navbar-mobile-menu"
        onClick={toggleMobileMenu}
      >
        <span className="navbar-toggle-bar" aria-hidden="true" />
        <span className="navbar-toggle-bar" aria-hidden="true" />
        <span className="navbar-toggle-bar" aria-hidden="true" />
      </button>

      <div
        id="navbar-mobile-menu"
        className={`navbar-mobile-menu${mobileMenuOpen ? " is-open" : ""}`}
        aria-hidden={!mobileMenuOpen}
        onClick={closeMobileMenu}
      >
        <div
          className="navbar-mobile-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {isLoggedIn ? (
            <>
              <div className="navbar-mobile-user">
                <span className="navbar-user-avatar" aria-hidden="true">
                  {userInitial}
                </span>
                <span className="navbar-mobile-user-name">{displayName}</span>
              </div>
              <div className="navbar-mobile-list">
                {isAdmin && (
                  <MobileNavLink
                    to="/admin"
                    label="Admin Panel"
                    icon={<AdminIcon />}
                    onClick={closeMobileMenu}
                  />
                )}
                <MobileNavLink
                  to="/account"
                  label="Account"
                  icon={<AccountIcon />}
                  onClick={closeMobileMenu}
                />
                <MobileNavLink
                  to="/appointments"
                  label="Appointments"
                  icon={<AppointmentsIcon />}
                  onClick={closeMobileMenu}
                />
              </div>
              <button
                type="button"
                className="navbar-mobile-logout"
                onClick={handleLogout}
              >
                <span className="navbar-mobile-link-label">Logout</span>
                <span className="navbar-mobile-link-icon navbar-mobile-link-icon--danger">
                  <LogoutIcon />
                </span>
              </button>
            </>
          ) : (
            <div className="navbar-mobile-list">
              <MobileNavLink
                to="/login"
                label="Login"
                icon={<LoginIcon />}
                onClick={closeMobileMenu}
              />
              <MobileNavLink
                to="/register"
                label="Register"
                icon={<RegisterIcon />}
                accent
                onClick={closeMobileMenu}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
