import { Link } from "react-router-dom";
import welcomeBg from "../assets/images/welcome-bg.png";
import { useAppSelector } from "../store/hooks";
import "./Home.scss";

function Home() {
  const isLoggedIn = !!useAppSelector((state) => state.auth.accessToken);

  return (
    <section className="welcome">
      <div className="welcome-banner" aria-hidden="true">
        <img
          className="welcome-banner-img"
          src={welcomeBg}
          alt=""
        />
      </div>

      <div className="welcome-content">
        <h1 className="welcome-title">Welcome to AppointWeb!</h1>

        <p className="welcome-description">
          Book appointments for the things that matter — dentist visits, fitness
          classes, salon treatments, tutoring sessions, and more. AppointWeb
          brings scheduling together in one simple place.
        </p>

        <ul className="welcome-features">
          <li>Dentists & healthcare</li>
          <li>Sports & activities</li>
          <li>Beauty & wellness</li>
          <li>Classes & personal services</li>
        </ul>

        {!isLoggedIn && (
          <div className="welcome-actions">
            <Link to="/register" className="welcome-btn welcome-btn-primary">
              Get started
            </Link>
            <Link to="/login" className="welcome-btn welcome-btn-secondary">
              Log in
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default Home;
