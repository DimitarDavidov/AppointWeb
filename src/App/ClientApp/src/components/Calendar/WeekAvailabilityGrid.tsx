import { useRef, useState } from "react";
import type { ProviderAvailabilitySlotInput } from "../../types/provider";
import {
  GRID_WEEKDAYS,
  cellKey,
  getGridRowCount,
  rowToTime,
  selectedCellsToSlots,
  slotsToSelectedCells,
} from "../../utils/weekAvailabilityGrid";
import "./WeekAvailabilityGrid.scss";

interface WeekAvailabilityGridProps {
  slots: ProviderAvailabilitySlotInput[];
  disabled?: boolean;
  onChange: (slots: ProviderAvailabilitySlotInput[]) => void;
}

export function WeekAvailabilityGrid({
  slots,
  disabled = false,
  onChange,
}: WeekAvailabilityGridProps) {
  const rowCount = getGridRowCount();
  const [selected, setSelected] = useState(() => slotsToSelectedCells(slots));
  const dragModeRef = useRef<"add" | "remove" | null>(null);
  const isDraggingRef = useRef(false);

  function emitChange(next: Set<string>) {
    setSelected(next);
    onChange(selectedCellsToSlots(next));
  }

  function toggleCell(dayOfWeek: number, row: number, forceOn?: boolean) {
    const key = cellKey(dayOfWeek, row);
    const next = new Set(selected);
    const shouldSelect = forceOn ?? !next.has(key);

    if (shouldSelect) {
      next.add(key);
    } else {
      next.delete(key);
    }

    emitChange(next);
  }

  function handlePointerDown(dayOfWeek: number, row: number) {
    if (disabled) return;

    isDraggingRef.current = true;
    const key = cellKey(dayOfWeek, row);
    dragModeRef.current = selected.has(key) ? "remove" : "add";
    toggleCell(dayOfWeek, row, dragModeRef.current === "add");
  }

  function handlePointerEnter(dayOfWeek: number, row: number) {
    if (disabled || !isDraggingRef.current || !dragModeRef.current) return;
    toggleCell(dayOfWeek, row, dragModeRef.current === "add");
  }

  function handlePointerUp() {
    isDraggingRef.current = false;
    dragModeRef.current = null;
  }

  return (
    <div
      className="week-hours"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <p className="week-hours-hint">
        Click or drag across the grid to set when this service can be booked.
        Each block is 30 minutes.
      </p>

      <div className="week-hours-scroll">
        <div
          className="week-hours-grid"
          style={{ "--week-hours-rows": rowCount } as React.CSSProperties}
        >
          <div className="week-hours-corner" aria-hidden="true" />
          {GRID_WEEKDAYS.map((day) => (
            <div key={day.value} className="week-hours-day-label">
              {day.label}
            </div>
          ))}

          {Array.from({ length: rowCount }).map((_, row) => (
            <div key={row} className="week-hours-row">
              <div className="week-hours-time-label">{rowToTime(row)}</div>
              {GRID_WEEKDAYS.map((day) => {
                const key = cellKey(day.value, row);
                const isActive = selected.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`week-hours-cell${
                      isActive ? " week-hours-cell--active" : ""
                    }`}
                    aria-pressed={isActive}
                    aria-label={`${day.label} ${rowToTime(row)}`}
                    disabled={disabled}
                    onPointerDown={() => handlePointerDown(day.value, row)}
                    onPointerEnter={() => handlePointerEnter(day.value, row)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
