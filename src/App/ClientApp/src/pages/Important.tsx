import { Link } from "react-router-dom";
import "./Important.scss";

const FEATURES = [
  {
    title: "Browse services",
    description:
      "Explore a catalog of demo services across healthcare, fitness, beauty, and more. Filter by category, location, and price.",
  },
  {
    title: "Book appointments",
    description:
      "Pick a time slot and book an appointment with a provider. View and manage your upcoming bookings from your account.",
  },
  {
    title: "Provider panel",
    description:
      "Providers can manage their services, availability, and incoming appointment requests.",
  },
  {
    title: "Admin panel",
    description:
      "Admins can oversee users, providers, and platform content for demonstration purposes.",
  },
  {
    title: "Account & notifications",
    description:
      "Register, log in, update your profile, and receive in-app notifications about appointment activity.",
  },
];

function Important() {
  return (
    <section className="important">
      <div className="important-inner">
        <h1 className="important-title">Important</h1>
        <p className="important-lead">
          Please read this before using AppointWeb. This page explains what the
          site does and what its current limitations are.
        </p>

        <div className="important-notice important-notice--portfolio">
          <h2 className="important-notice-title">Portfolio project</h2>
          <p>
            AppointWeb is a demonstration project built for a portfolio. All
            services, providers, appointments, and user data are fictional —
            nothing on this site is real.
          </p>
        </div>

        <div className="important-notice important-notice--email">
          <h2 className="important-notice-title">Email on the live site</h2>
          <p>
            Sending emails (such as password reset links and confirmation
            messages) works when running the project locally, but not on the
            deployed site yet. A custom domain is required for email delivery in
            production. Once a domain is purchased and configured, email
            functionality can be enabled there too.
          </p>
        </div>

        <div className="important-features">
          <h2 className="important-section-title">What you can try</h2>
          <ul className="important-feature-list">
            {FEATURES.map(({ title, description }) => (
              <li key={title} className="important-feature">
                <h3 className="important-feature-title">{title}</h3>
                <p className="important-feature-description">{description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="important-actions">
          <Link to="/" className="important-btn important-btn--primary">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Important;
