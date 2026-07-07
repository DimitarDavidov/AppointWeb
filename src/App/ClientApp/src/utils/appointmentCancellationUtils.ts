import type { AppointmentDetail } from "../types/appointment";
import { capitalizeFirstLetter } from "./formatDisplayName";
import { isSameId } from "./isSameId";

export function getCancelledByLabel(
  appointment: AppointmentDetail,
  currentUserId: string | null
): string | null {
  if (!appointment.cancelledByUserId) {
    return null;
  }

  if (currentUserId && isSameId(appointment.cancelledByUserId, currentUserId)) {
    return "You";
  }

  if (isSameId(appointment.cancelledByUserId, appointment.customerId)) {
    return capitalizeFirstLetter(appointment.customerUsername);
  }

  if (isSameId(appointment.cancelledByUserId, appointment.providerId)) {
    return capitalizeFirstLetter(appointment.providerUsername);
  }

  return "Admin";
}
