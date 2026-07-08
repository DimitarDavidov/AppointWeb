export const GRID_DAY_START_HOUR = 6;
export const GRID_DAY_END_HOUR = 22;
export const GRID_STEP_MINUTES = 30;

export const GRID_WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

export function getGridRowCount(): number {
  return ((GRID_DAY_END_HOUR - GRID_DAY_START_HOUR) * 60) / GRID_STEP_MINUTES;
}

export function rowToTime(row: number): string {
  const totalMinutes = GRID_DAY_START_HOUR * 60 + row * GRID_STEP_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function timeToRow(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = GRID_DAY_START_HOUR * 60;
  return Math.round((totalMinutes - startMinutes) / GRID_STEP_MINUTES);
}

export function cellKey(dayOfWeek: number, row: number): string {
  return `${dayOfWeek}-${row}`;
}

export function parseCellKey(key: string): { dayOfWeek: number; row: number } {
  const [day, row] = key.split("-");
  return { dayOfWeek: Number(day), row: Number(row) };
}

export function slotsToSelectedCells(
  slots: { dayOfWeek: number; startTime: string; endTime: string }[]
): Set<string> {
  const selected = new Set<string>();
  const rowCount = getGridRowCount();

  for (const slot of slots) {
    const startRow = Math.max(0, timeToRow(slot.startTime));
    const endRow = Math.min(rowCount, timeToRow(slot.endTime));

    for (let row = startRow; row < endRow; row++) {
      selected.add(cellKey(slot.dayOfWeek, row));
    }
  }

  return selected;
}

export function selectedCellsToSlots(
  selected: Set<string>
): { dayOfWeek: number; startTime: string; endTime: string }[] {
  const byDay = new Map<number, number[]>();

  for (const key of selected) {
    const { dayOfWeek, row } = parseCellKey(key);
    const rows = byDay.get(dayOfWeek) ?? [];
    rows.push(row);
    byDay.set(dayOfWeek, rows);
  }

  const slots: { dayOfWeek: number; startTime: string; endTime: string }[] = [];

  for (const [dayOfWeek, rows] of byDay) {
    const sorted = [...rows].sort((a, b) => a - b);
    let startRow = sorted[0];
    let prevRow = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prevRow + 1) {
        prevRow = sorted[i];
        continue;
      }

      slots.push({
        dayOfWeek,
        startTime: rowToTime(startRow),
        endTime: rowToTime(prevRow + 1),
      });

      startRow = sorted[i];
      prevRow = sorted[i];
    }

    slots.push({
      dayOfWeek,
      startTime: rowToTime(startRow),
      endTime: rowToTime(prevRow + 1),
    });
  }

  return slots.sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
  );
}
