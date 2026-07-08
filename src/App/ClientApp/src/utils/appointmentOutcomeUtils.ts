import type { AppointmentDetail } from "../types/appointment";

export function needsAppointmentOutcome(
  appointment: AppointmentDetail
): boolean {
  return (
    appointment.status === "Booked" &&
    new Date(appointment.endTime).getTime() < Date.now()
  );
}

export function getAppointmentsNeedingOutcome(
  appointments: AppointmentDetail[]
): AppointmentDetail[] {
  return appointments
    .filter(needsAppointmentOutcome)
    .sort(
      (a, b) =>
        new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
}

export function isRateableStatus(status: string): boolean {
  return (
    status === "Completed" || status === "NoShow" || status === "Cancelled"
  );
}

export type AppointmentOutcomeViewer = "customer" | "provider";

export function getOutcomeStatusLabel(
  status: string,
  viewer: AppointmentOutcomeViewer
): string {
  switch (status) {
    case "Completed":
      return viewer === "customer" ? "Service completed" : "Customer attended";
    case "NoShow":
      return viewer === "customer" ? "Did not take place" : "Customer no-show";
    default:
      return status;
  }
}

export function getOutcomeActionLabels(viewer: AppointmentOutcomeViewer) {
  if (viewer === "customer") {
    return {
      prompt: "How did your appointment go?",
      hint: "Tell us whether this service took place as scheduled.",
      completed: "Service completed",
      notCompleted: "Did not take place",
    };
  }

  return {
    prompt: "Update appointment status",
    hint: "Mark whether the customer attended this finished appointment.",
    completed: "Customer attended",
    notCompleted: "Customer no-show",
  };
}
