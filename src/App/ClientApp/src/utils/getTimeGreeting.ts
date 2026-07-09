/** IANA timezone from the user's browser (e.g. "Europe/Sofia"). */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Hour (0–23) in the given IANA timezone for `date`. */
export function getLocalHour(
  date: Date = new Date(),
  timeZone: string = getUserTimeZone()
): number {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  })
    .formatToParts(date)
    .find((part) => part.type === "hour");

  if (!hourPart) {
    return date.getHours();
  }

  const hour = Number(hourPart.value);
  return hour === 24 ? 0 : hour;
}

/**
 * Time-of-day greeting based on the user's local timezone.
 * Afternoon runs until 18:00; evening starts at 18:00.
 */
export function getTimeGreeting(timeZone: string = getUserTimeZone()): string {
  const hour = getLocalHour(new Date(), timeZone);

  if (hour >= 5 && hour < 12) {
    return "Good morning";
  }

  if (hour >= 12 && hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}
