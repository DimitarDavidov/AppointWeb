import { getProviderAppointments, getProviderServices } from "../api/provider";
import { useAsyncData } from "./useAsyncData";
import {
  computeProviderStats,
  getCancelledAppointments,
  getPastAppointments,
  getPendingAppointments,
  getUpcomingAppointments,
} from "../utils/providerPanelUtils";

export function useProviderPanelData() {
  const appointmentsQuery = useAsyncData(getProviderAppointments, [], {
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

  const pendingAppointments = getPendingAppointments(
    appointmentsQuery.data ?? []
  );

  const pastAppointments = getPastAppointments(appointmentsQuery.data ?? []);

  const cancelledAppointments = getCancelledAppointments(
    appointmentsQuery.data ?? []
  );

  const stats = computeProviderStats(
    appointmentsQuery.data ?? [],
    services.length
  );

  return {
    services,
    upcomingAppointments,
    pendingAppointments,
    pastAppointments,
    cancelledAppointments,
    stats,
    appointmentsQuery,
    servicesQuery,
    reloadAppointments: appointmentsQuery.reload,
    reloadServices: servicesQuery.reload,
  };
}
