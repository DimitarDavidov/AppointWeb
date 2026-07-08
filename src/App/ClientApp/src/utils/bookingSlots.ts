export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupSlotsByLocalDate(slots: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const slot of slots) {
    const key = toLocalDateKey(new Date(slot));
    const existing = grouped.get(key) ?? [];
    existing.push(slot);
    grouped.set(key, existing);
  }

  for (const [key, values] of grouped) {
    grouped.set(
      key,
      values.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    );
  }

  return grouped;
}

export function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatSelectedDayHeading(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
}

export function endOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59));
}
