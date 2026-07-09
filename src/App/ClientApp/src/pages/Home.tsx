import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import welcomeBg from "../assets/images/welcome-bg.png";
import { getCatalogOfferings } from "../api/catalog";
import { useAsyncData } from "../hooks/useAsyncData";
import { capitalizeFirstLetter } from "../utils/formatDisplayName";
import {
  formatDuration,
  formatPrice,
  formatServiceLocation,
} from "../utils/formatService";
import {
  filterCatalogOfferings,
  hasActiveCatalogFilters,
} from "../utils/catalogFilters";
import {
  OTHER_CATEGORY,
  SERVICE_CATEGORIES,
} from "../constants/serviceCategories";
import type { ServiceCategory } from "../constants/serviceCategories";
import { PRICE_RANGES, getPriceRangeById } from "../constants/priceRanges";
import { isSameId } from "../utils/isSameId";
import { useAppSelector } from "../store/hooks";
import { StarRatingDisplay } from "../components/Rating/StarRating";
import "./Home.scss";

const WELCOME_CATEGORIES: { label: string; category: ServiceCategory }[] = [
  { label: "Dentists & healthcare", category: "Healthcare & Dental" },
  { label: "Sports & activities", category: "Sports & Fitness" },
  { label: "Beauty & wellness", category: "Beauty & Wellness" },
  { label: "Classes & personal services", category: "Classes & Coaching" },
];

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPriceRangeId, setSelectedPriceRangeId] = useState<
    string | null
  >(null);
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
      offerings.filter((offering) => !isSameId(userId, offering.providerId)),
    [offerings, userId]
  );

  const availableCategories = useMemo(() => {
    const present = new Set(
      bookableOfferings
        .map((offering) => offering.category)
        .filter((category): category is string => !!category)
        .map((category) => category.toLowerCase())
    );
    const hasUncategorized = bookableOfferings.some(
      (offering) => !offering.category
    );

    return SERVICE_CATEGORIES.filter((category) => {
      if (category.toLowerCase() === OTHER_CATEGORY.toLowerCase()) {
        return present.has(OTHER_CATEGORY.toLowerCase()) || hasUncategorized;
      }
      return present.has(category.toLowerCase());
    });
  }, [bookableOfferings]);

  const selectedPriceRange = getPriceRangeById(selectedPriceRangeId);

  const filters = useMemo(
    () => ({
      serviceQuery: serviceSearchQuery,
      locationQuery: locationSearchQuery,
      category: selectedCategory,
      priceRange: selectedPriceRange,
    }),
    [
      serviceSearchQuery,
      locationSearchQuery,
      selectedCategory,
      selectedPriceRange,
    ]
  );

  const hasActiveFilters = hasActiveCatalogFilters(filters);

  const filteredOfferings = useMemo(
    () => filterCatalogOfferings(bookableOfferings, filters),
    [bookableOfferings, filters]
  );

  const clearFilters = () => {
    setServiceSearchQuery("");
    setLocationSearchQuery("");
    setSelectedCategory(null);
    setSelectedPriceRangeId(null);
  };

  const handleSelectWelcomeCategory = (category: ServiceCategory) => {
    setSelectedCategory((current) =>
      current === category ? current : category
    );
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
            Book appointments for the things that matter — dentist visits,
            fitness classes, salon treatments, tutoring sessions, and more.
            AppointWeb brings scheduling together in one simple place.
          </p>

          <ul className="welcome-features">
            {WELCOME_CATEGORIES.map(({ label, category }) => (
              <li key={label}>
                <button
                  type="button"
                  className="welcome-feature"
                  onClick={() => handleSelectWelcomeCategory(category)}
                >
                  {label}
                </button>
              </li>
            ))}
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
                Search by service or provider, then narrow results by location,
                category, or price.
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
                  onChange={(event) =>
                    setServiceSearchQuery(event.target.value)
                  }
                />
              </label>

              <label
                className="catalog-search"
                htmlFor="catalog-location-search"
              >
                <LocationIcon />
                <input
                  id="catalog-location-search"
                  type="search"
                  placeholder="City, country, or remote..."
                  autoComplete="off"
                  value={locationSearchQuery}
                  onChange={(event) =>
                    setLocationSearchQuery(event.target.value)
                  }
                />
              </label>
            </div>

            {!isLoadingCatalog &&
              !catalogError &&
              bookableOfferings.length > 0 && (
                <div className="catalog-filters">
                  {availableCategories.length > 0 && (
                    <div className="catalog-filter-group">
                      <span className="catalog-filter-label">Category</span>
                      <div className="catalog-filter-chips">
                        <button
                          type="button"
                          className={`catalog-filter-chip${
                            selectedCategory === null
                              ? " catalog-filter-chip--active"
                              : ""
                          }`}
                          aria-pressed={selectedCategory === null}
                          onClick={() => setSelectedCategory(null)}
                        >
                          All
                        </button>
                        {availableCategories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            className={`catalog-filter-chip${
                              selectedCategory === category
                                ? " catalog-filter-chip--active"
                                : ""
                            }`}
                            aria-pressed={selectedCategory === category}
                            onClick={() =>
                              setSelectedCategory((current) =>
                                current === category ? null : category
                              )
                            }
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="catalog-filter-group">
                    <span className="catalog-filter-label">Price</span>
                    <div className="catalog-filter-chips">
                      <button
                        type="button"
                        className={`catalog-filter-chip${
                          selectedPriceRangeId === null
                            ? " catalog-filter-chip--active"
                            : ""
                        }`}
                        aria-pressed={selectedPriceRangeId === null}
                        onClick={() => setSelectedPriceRangeId(null)}
                      >
                        Any price
                      </button>
                      {PRICE_RANGES.map((range) => (
                        <button
                          key={range.id}
                          type="button"
                          className={`catalog-filter-chip${
                            selectedPriceRangeId === range.id
                              ? " catalog-filter-chip--active"
                              : ""
                          }`}
                          aria-pressed={selectedPriceRangeId === range.id}
                          onClick={() =>
                            setSelectedPriceRangeId((current) =>
                              current === range.id ? null : range.id
                            )
                          }
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="catalog-clear"
                      onClick={clearFilters}
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
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

          {!isLoadingCatalog &&
            !catalogError &&
            bookableOfferings.length === 0 && (
              <p className="catalog-status">No services available yet.</p>
            )}

          {!isLoadingCatalog &&
            !catalogError &&
            bookableOfferings.length > 0 &&
            filteredOfferings.length === 0 &&
            hasActiveFilters && (
              <p className="catalog-status">
                No services match your filters. Try adjusting your search,
                category, or price.
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
                    {offering.ratingCount > 0 && (
                      <div className="catalog-card-rating">
                        <StarRatingDisplay
                          value={offering.averageRating}
                          size="sm"
                          showValue
                          count={offering.ratingCount}
                        />
                      </div>
                    )}
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
