export const PROVIDER_WEEKDAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
] as const;

export function getWeekdayLabel(dayOfWeek: number): string {
  return (
    PROVIDER_WEEKDAYS.find((day) => day.value === dayOfWeek)?.label ??
    "Unknown day"
  );
}

export function formatAvailabilitySlot(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): string {
  return `${getWeekdayLabel(dayOfWeek)} · ${startTime} – ${endTime}`;
}
