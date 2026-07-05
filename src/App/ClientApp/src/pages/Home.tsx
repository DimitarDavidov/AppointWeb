import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import welcomeBg from "../assets/images/welcome-bg.png";
import { getServices } from "../api/services";
import type { Service } from "../types/service";
import { useAppSelector } from "../store/hooks";
import "./Home.scss";

function SearchIcon() {
  return (
    <svg
      className="catalog-search-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function Home() {
  const isLoggedIn = !!useAppSelector((state) => state.auth.accessToken);
  const catalogRef = useRef<HTMLElement>(null);
  const [catalogVisible, setCatalogVisible] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      try {
        const data = await getServices();
        if (!cancelled) {
          setServices(data);
        }
      } catch {
        if (!cancelled) {
          setServicesError("Could not load services. Please try again later.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingServices(false);
        }
      }
    }

    loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const section = catalogRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCatalogVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="welcome">
        <div className="welcome-banner" aria-hidden="true">
          <img className="welcome-banner-img" src={welcomeBg} alt="" />
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

      <section
        ref={catalogRef}
        className={`catalog${catalogVisible ? " catalog--visible" : ""}`}
        aria-labelledby="catalog-title"
      >
        <div className="catalog-inner">
          <div className="catalog-header">
            <div className="catalog-intro">
              <h2 id="catalog-title" className="catalog-title">
                Browse services
              </h2>
              <p className="catalog-subtitle">
                Scroll to explore what you can book on AppointWeb.
              </p>
            </div>

            <label className="catalog-search" htmlFor="catalog-search">
              <SearchIcon />
              <input
                id="catalog-search"
                type="search"
                placeholder="Search services..."
                autoComplete="off"
              />
            </label>
          </div>

          {isLoadingServices && (
            <p className="catalog-status" aria-live="polite">
              Loading services...
            </p>
          )}

          {servicesError && (
            <p className="catalog-status catalog-status--error" role="alert">
              {servicesError}
            </p>
          )}

          {!isLoadingServices && !servicesError && services.length === 0 && (
            <p className="catalog-status">No services available yet.</p>
          )}

          {!isLoadingServices && !servicesError && services.length > 0 && (
            <ul className="catalog-grid">
              {services.map((service, index) => (
                <li
                  key={service.id}
                  className="catalog-card"
                  style={{ animationDelay: `${0.06 + index * 0.07}s` }}
                >
                  <Link to={`/services/${service.id}`} className="catalog-card-link">
                    <h3 className="catalog-card-name">{service.name}</h3>
                    {service.description && (
                      <p className="catalog-card-description">
                        {service.description}
                      </p>
                    )}
                    <div className="catalog-card-meta">
                      <span>{formatDuration(service.durationMinutes)}</span>
                      <span className="catalog-card-price">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
