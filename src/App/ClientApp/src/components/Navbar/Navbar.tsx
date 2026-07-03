import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import "./Navbar.scss";

function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { accessToken, email } = useAppSelector((state) => state.auth);
  const isLoggedIn = !!accessToken;

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
          <>
            {email && <span className="navbar-user">{email}</span>}
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
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
