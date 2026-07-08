import "react-day-picker/style.css";
import { DayPicker } from "react-day-picker";
import { useEffect, useMemo, useState } from "react";
import { getBookingSlots } from "../../api/catalog";
import { getErrorMessage } from "../../api/errors";
import {
  endOfMonthUtc,
  formatSelectedDayHeading,
  formatSlotTime,
  groupSlotsByLocalDate,
  startOfMonthUtc,
  toLocalDateKey,
} from "../../utils/bookingSlots";
import "./AppointmentBookingPicker.scss";

interface AppointmentBookingPickerProps {
  providerId: string;
  serviceId: string;
  durationMinutes: number;
  selectedStart: string | null;
  onSelect: (isoStart: string) => void;
}

export function AppointmentBookingPicker({
  providerId,
  serviceId,
  durationMinutes,
  selectedStart,
  onSelect,
}: AppointmentBookingPickerProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(() => new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      setIsLoading(true);
      setError("");

      try {
        const from = startOfMonthUtc(visibleMonth);
        const to = endOfMonthUtc(visibleMonth);
        const data = await getBookingSlots(providerId, serviceId, from, to);

        if (cancelled) return;
        setSlots(data.slots);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Could not load available times."));
          setSlots([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [providerId, serviceId, visibleMonth]);

  const slotsByDate = useMemo(() => groupSlotsByLocalDate(slots), [slots]);

  const availableDates = useMemo(
    () =>
      Array.from(slotsByDate.keys()).map((key) => {
        const [year, month, day] = key.split("-").map(Number);
        return new Date(year, month - 1, day);
      }),
    [slotsByDate]
  );

  const selectedDayKey = selectedDay ? toLocalDateKey(selectedDay) : null;
  const daySlots = selectedDayKey ? (slotsByDate.get(selectedDayKey) ?? []) : [];

  useEffect(() => {
    if (!selectedDay) return;

    const key = toLocalDateKey(selectedDay);
    const hasSlots = slotsByDate.has(key);
    if (!hasSlots && availableDates.length > 0) {
      setSelectedDay(availableDates[0]);
    }
  }, [availableDates, selectedDay, slotsByDate]);

  return (
    <div className="booking-picker">
      <div className="booking-picker-layout">
        <div className="booking-picker-calendar">
          <DayPicker
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            disabled={{ before: new Date() }}
            modifiers={{ available: availableDates }}
            modifiersClassNames={{ available: "booking-picker-day--available" }}
            showOutsideDays
            fixedWeeks
          />
          <p className="booking-picker-calendar-hint">
            Days with a dot have open slots. Duration: {durationMinutes} min.
          </p>
        </div>

        <div className="booking-picker-slots-panel">
          <h3 className="booking-picker-slots-title">
            {selectedDay
              ? formatSelectedDayHeading(selectedDay)
              : "Select a date"}
          </h3>

          {isLoading && (
            <p className="booking-picker-slots-status">Loading times...</p>
          )}

          {error && !isLoading && (
            <p className="booking-picker-slots-error" role="alert">
              {error}
            </p>
          )}

          {!isLoading && !error && daySlots.length === 0 && (
            <p className="booking-picker-slots-status">
              No open times on this day. Try another date.
            </p>
          )}

          {!isLoading && !error && daySlots.length > 0 && (
            <ul className="booking-picker-slot-list">
              {daySlots.map((slot) => {
                const isSelected = selectedStart === slot;
                return (
                  <li key={slot}>
                    <button
                      type="button"
                      className={`booking-picker-slot${
                        isSelected ? " booking-picker-slot--selected" : ""
                      }`}
                      aria-pressed={isSelected}
                      onClick={() => onSelect(slot)}
                    >
                      {formatSlotTime(slot)}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
