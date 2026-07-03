import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import "./Navbar.scss";

function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { accessToken, username, role } = useAppSelector(
    (state) => state.auth
  );
  const isLoggedIn = !!accessToken;
  const isAdmin = role === "Admin";
  const displayName = username ?? "User";

  function handleLogout() {
    dispatch(logout());
    navigate("/");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Appoint
      </Link>

      <div className="navbar-actions">
        {isLoggedIn ? (
          <div className="navbar-user-menu">
            <button type="button" className="navbar-user-trigger">
              {displayName}
            </button>

            <div className="navbar-dropdown">
              {isAdmin && (
                <Link to="/admin" className="navbar-dropdown-item">
                  Admin Panel
                </Link>
              )}
              <Link to="/account" className="navbar-dropdown-item">
                Account
              </Link>
              <Link to="/appointments" className="navbar-dropdown-item">
                Appointments
              </Link>
              <button
                type="button"
                className="navbar-dropdown-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="navbar-link">
              Login
            </Link>
            <Link to="/register" className="navbar-link">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
