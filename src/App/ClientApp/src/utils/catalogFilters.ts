import type { PriceRange } from "../constants/priceRanges";
import { OTHER_CATEGORY } from "../constants/serviceCategories";
import type { CatalogOffering } from "../types/catalog";

function includesQuery(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query);
}

export function matchesServiceSearch(
  offering: CatalogOffering,
  query: string
): boolean {
  const haystack = [
    offering.serviceName,
    offering.providerUsername,
    offering.category,
    offering.description,
  ]
    .filter(Boolean)
    .join(" ");

  return includesQuery(haystack, query);
}

export function matchesLocationSearch(
  offering: CatalogOffering,
  query: string
): boolean {
  const haystack = [
    offering.isRemote ? "remote online virtual" : "",
    offering.city,
    offering.country,
  ]
    .filter(Boolean)
    .join(" ");

  return includesQuery(haystack, query);
}

export function matchesCategory(
  offering: CatalogOffering,
  category: string
): boolean {
  const normalizedCategory = category.toLowerCase();

  // "Other" also captures services that have no category assigned.
  if (normalizedCategory === OTHER_CATEGORY.toLowerCase()) {
    return (
      !offering.category ||
      offering.category.toLowerCase() === OTHER_CATEGORY.toLowerCase()
    );
  }

  if (!offering.category) return false;
  return offering.category.toLowerCase() === normalizedCategory;
}

export function matchesPriceRange(
  offering: CatalogOffering,
  range: PriceRange
): boolean {
  return offering.price >= range.min && offering.price < range.max;
}

export interface CatalogFilters {
  serviceQuery?: string;
  locationQuery?: string;
  category?: string | null;
  priceRange?: PriceRange | null;
}

export function filterCatalogOfferings(
  offerings: CatalogOffering[],
  filters: CatalogFilters
): CatalogOffering[] {
  const normalizedService = (filters.serviceQuery ?? "").trim().toLowerCase();
  const normalizedLocation = (filters.locationQuery ?? "").trim().toLowerCase();
  const { category, priceRange } = filters;

  return offerings.filter((offering) => {
    if (
      normalizedService &&
      !matchesServiceSearch(offering, normalizedService)
    ) {
      return false;
    }

    if (
      normalizedLocation &&
      !matchesLocationSearch(offering, normalizedLocation)
    ) {
      return false;
    }

    if (category && !matchesCategory(offering, category)) {
      return false;
    }

    if (priceRange && !matchesPriceRange(offering, priceRange)) {
      return false;
    }

    return true;
  });
}

export function hasActiveCatalogFilters(filters: CatalogFilters): boolean {
  return (
    (filters.serviceQuery ?? "").trim().length > 0 ||
    (filters.locationQuery ?? "").trim().length > 0 ||
    !!filters.category ||
    !!filters.priceRange
  );
}
