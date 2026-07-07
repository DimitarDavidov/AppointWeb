import { useMemo } from "react";
import { getAppointments } from "../api/appointments";
import { getCatalogOfferings } from "../api/catalog";
import { useAsyncData } from "./useAsyncData";
import {
  computeProviderStats,
  getUpcomingAppointments,
} from "../utils/providerPanelUtils";

export function useProviderPanelData(userId: string | null) {
  const appointmentsQuery = useAsyncData(getAppointments, [], {
    initialData: [],
    errorMessage: "Could not load appointments. Please try again.",
  });

  const catalogQuery = useAsyncData(getCatalogOfferings, [], {
    initialData: [],
    errorMessage: "Could not load your services. Please try again.",
  });

  const services = useMemo(
    () =>
      userId
        ? (catalogQuery.data ?? []).filter(
            (offering) => offering.providerId === userId
          )
        : [],
    [catalogQuery.data, userId]
  );

  const upcomingAppointments = useMemo(
    () => getUpcomingAppointments(appointmentsQuery.data ?? []),
    [appointmentsQuery.data]
  );

  const stats = useMemo(
    () => computeProviderStats(appointmentsQuery.data ?? [], services.length),
    [appointmentsQuery.data, services.length]
  );

  return {
    services,
    upcomingAppointments,
    stats,
    appointmentsQuery,
    catalogQuery,
    reloadAppointments: appointmentsQuery.reload,
  };
}
