import type { AdminCancelledAppointment } from "../types/admin";

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

export function toCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCsvValue).join(",")
  );

  return lines.join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF", content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildCancelledAppointmentsCsv(
  appointments: AdminCancelledAppointment[]
): string {
  const headers = [
    "Appointment ID",
    "Service",
    "Customer",
    "Provider",
    "Start time",
    "End time",
    "Price at booking",
    "Cancellation reason",
    "Booked at",
  ];

  const rows = appointments.map((appointment) => [
    appointment.id,
    appointment.serviceName,
    appointment.customerUsername,
    appointment.providerUsername,
    new Date(appointment.startTime).toISOString(),
    new Date(appointment.endTime).toISOString(),
    appointment.priceAtBooking.toFixed(2),
    appointment.cancellationReason ?? "",
    new Date(appointment.createdAt).toISOString(),
  ]);

  return toCsv(headers, rows);
}

export function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase();
}
