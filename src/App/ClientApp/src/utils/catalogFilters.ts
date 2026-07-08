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
  const haystack = [offering.city, offering.country].filter(Boolean).join(" ");

  return includesQuery(haystack, query);
}

export function filterCatalogOfferings(
  offerings: CatalogOffering[],
  serviceQuery: string,
  locationQuery: string
): CatalogOffering[] {
  const normalizedService = serviceQuery.trim().toLowerCase();
  const normalizedLocation = locationQuery.trim().toLowerCase();

  return offerings.filter((offering) => {
    if (normalizedService && !matchesServiceSearch(offering, normalizedService)) {
      return false;
    }

    if (normalizedLocation && !matchesLocationSearch(offering, normalizedLocation)) {
      return false;
    }

    return true;
  });
}

export function describeCatalogFilterSummary(
  serviceQuery: string,
  locationQuery: string
): string {
  const service = serviceQuery.trim();
  const location = locationQuery.trim();

  if (service && location) {
    return `"${service}" in "${location}"`;
  }

  if (service) {
    return `"${service}"`;
  }

  return `"${location}"`;
}
