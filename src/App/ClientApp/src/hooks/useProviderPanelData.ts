import { getAppointments } from "../api/appointments";
import { getProviderServices } from "../api/provider";
import { useAsyncData } from "./useAsyncData";
import {
  computeProviderStats,
  getUpcomingAppointments,
} from "../utils/providerPanelUtils";

export function useProviderPanelData() {
  const appointmentsQuery = useAsyncData(getAppointments, [], {
    initialData: [],
    errorMessage: "Could not load appointments. Please try again.",
  });

  const servicesQuery = useAsyncData(getProviderServices, [], {
    initialData: [],
    errorMessage: "Could not load your services. Please try again.",
  });

  const services = servicesQuery.data ?? [];

  const upcomingAppointments = getUpcomingAppointments(
    appointmentsQuery.data ?? []
  );

  const stats = computeProviderStats(
    appointmentsQuery.data ?? [],
    services.length
  );

  return {
    services,
    upcomingAppointments,
    stats,
    appointmentsQuery,
    servicesQuery,
    reloadAppointments: appointmentsQuery.reload,
    reloadServices: servicesQuery.reload,
  };
}
