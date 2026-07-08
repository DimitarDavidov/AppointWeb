import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import welcomeBg from "../assets/images/welcome-bg.png";
import { getCatalogOfferings } from "../api/catalog";
import { useAsyncData } from "../hooks/useAsyncData";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import { formatDuration, formatPrice, formatServiceLocation } from "../utils/formatService";
import {
  describeCatalogFilterSummary,
  filterCatalogOfferings,
} from "../utils/catalogFilters";
import { isSameId } from "../utils/isSameId";
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

function LocationIcon() {
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
      <path d="M12 21s7-4.5 7-10a7 7 0 1 0-14 0c0 5.5 7 10 7 10z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function Home() {
  const { accessToken, userId } = useAppSelector((state) => state.auth);
  const isLoggedIn = !!accessToken;
  const catalogRef = useRef<HTMLElement>(null);
  const [catalogVisible, setCatalogVisible] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const {
    data: offerings = [],
    isLoading: isLoadingCatalog,
    error: catalogError,
  } = useAsyncData(getCatalogOfferings, [], {
    initialData: [],
    errorMessage: "Could not load services. Please try again later.",
  });
  const bookableOfferings = useMemo(
    () =>
      offerings.filter(
        (offering) => !isSameId(userId, offering.providerId)
      ),
    [offerings, userId]
  );
  const hasActiveFilters =
    serviceSearchQuery.trim().length > 0 || locationSearchQuery.trim().length > 0;
  const filteredOfferings = useMemo(
    () =>
      filterCatalogOfferings(
        bookableOfferings,
        serviceSearchQuery,
        locationSearchQuery
      ),
    [bookableOfferings, serviceSearchQuery, locationSearchQuery]
  );

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
                Search by service or provider, then narrow results by city or
                country.
              </p>
            </div>

            <div className="catalog-search-bar">
              <label className="catalog-search" htmlFor="catalog-service-search">
                <SearchIcon />
                <input
                  id="catalog-service-search"
                  type="search"
                  placeholder="Search services..."
                  autoComplete="off"
                  value={serviceSearchQuery}
                  onChange={(event) => setServiceSearchQuery(event.target.value)}
                />
              </label>

              <label className="catalog-search" htmlFor="catalog-location-search">
                <LocationIcon />
                <input
                  id="catalog-location-search"
                  type="search"
                  placeholder="City, country, or remote..."
                  autoComplete="off"
                  value={locationSearchQuery}
                  onChange={(event) => setLocationSearchQuery(event.target.value)}
                />
              </label>
            </div>
          </div>

          {isLoadingCatalog && (
            <p className="catalog-status" aria-live="polite">
              Loading services...
            </p>
          )}

          {catalogError && (
            <p className="catalog-status catalog-status--error" role="alert">
              {catalogError}
            </p>
          )}

          {!isLoadingCatalog && !catalogError && bookableOfferings.length === 0 && (
            <p className="catalog-status">No services available yet.</p>
          )}

          {!isLoadingCatalog &&
            !catalogError &&
            bookableOfferings.length > 0 &&
            filteredOfferings.length === 0 &&
            hasActiveFilters && (
              <p className="catalog-status">
                No services match{" "}
                {describeCatalogFilterSummary(
                  serviceSearchQuery,
                  locationSearchQuery
                )}
                .
              </p>
            )}

          {!isLoadingCatalog && !catalogError && filteredOfferings.length > 0 && (
            <ul className="catalog-grid">
              {filteredOfferings.map((offering, index) => (
                <li
                  key={`${offering.providerId}-${offering.serviceId}`}
                  className="catalog-card"
                  style={{ animationDelay: `${0.06 + index * 0.07}s` }}
                >
                  <Link
                    to={`/book/${offering.providerId}/${offering.serviceId}`}
                    className="catalog-card-link"
                  >
                    {offering.category && (
                      <span className="catalog-card-category">
                        {offering.category}
                      </span>
                    )}
                    <p className="catalog-card-provider">
                      {capitalizeFirstLetter(offering.providerUsername)}
                    </p>
                    <p className="catalog-card-location">
                      {formatServiceLocation(
                        offering.city,
                        offering.country,
                        offering.isRemote
                      )}
                    </p>
                    <h3 className="catalog-card-name">{offering.serviceName}</h3>
                    {offering.description && (
                      <p className="catalog-card-description">
                        {offering.description}
                      </p>
                    )}
                    <div className="catalog-card-meta">
                      <span>{formatDuration(offering.durationMinutes)}</span>
                      <span className="catalog-card-price">
                        {formatPrice(offering.price)}
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
