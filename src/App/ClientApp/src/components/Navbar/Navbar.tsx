import { Link } from "react-router-dom";
import "./Navbar.scss";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Appoint
      </Link>

      <div className="navbar-actions">
        <button type="button">Login</button>
        <button type="button">Logout</button>
        <button type="button">Register</button>
      </div>
    </nav>
  );
}

export default Navbar;
