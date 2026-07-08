using AppointWeb.Api.Data;
using AppointWeb.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Services;

public class BookingSlotService
{
    private const int MaxRangeDays = 62;
    private static readonly TimeOnly DefaultDayStart = new(8, 0);
    private static readonly TimeOnly DefaultDayEnd = new(20, 0);

    private readonly AppDbContext _db;

    public BookingSlotService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<(int DurationMinutes, List<DateTime> Slots)?> GetAvailableSlotsAsync(
        Guid providerId,
        Guid serviceId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken ct)
    {
        var offering = await _db.ProviderServices
            .AsNoTracking()
            .Where(ps =>
                ps.ProviderId == providerId &&
                ps.ServiceId == serviceId &&
                ps.IsActive &&
                ps.Service.IsActive &&
                ps.Provider.Role == UserRoles.Provider)
            .Select(ps => new { ps.Service.DurationMinutes, ps.Provider.TimeZoneId })
            .SingleOrDefaultAsync(ct);

        if (offering is null)
            return null;

        var fromDate = DateOnly.FromDateTime(fromUtc);
        var toDate = DateOnly.FromDateTime(toUtc);

        if (toDate < fromDate)
            return (offering.DurationMinutes, []);

        if (toDate.DayNumber - fromDate.DayNumber > MaxRangeDays)
            toDate = fromDate.AddDays(MaxRangeDays);

        var providerTz = TimeZoneResolver.Resolve(offering.TimeZoneId);

        var availability = await _db.ProviderAvailabilities
            .AsNoTracking()
            .Where(a => a.ProviderId == providerId && a.ServiceId == serviceId)
            .ToListAsync(ct);

        // Only return slots whose UTC start falls inside the requested range.
        var rangeStart = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var rangeEnd = toDate.ToDateTime(new TimeOnly(23, 59, 59), DateTimeKind.Utc);

        // Appointments are fetched with a one-day margin so overlaps near the
        // range edges (and across the provider's UTC offset) are still caught.
        var apptFrom = rangeStart.AddDays(-1);
        var apptTo = rangeEnd.AddDays(1);

        var appointments = await _db.Appointments
            .AsNoTracking()
            .Where(a =>
                a.ProviderId == providerId &&
                (a.Status == AppointmentStatus.Booked || a.Status == AppointmentStatus.Pending) &&
                a.StartTime < apptTo &&
                a.EndTime > apptFrom)
            .Select(a => new TimeRange { Start = a.StartTime, End = a.EndTime })
            .ToListAsync(ct);

        var duration = offering.DurationMinutes;
        var stepMinutes = duration >= 30 ? duration : 15;
        var nowUtc = DateTime.UtcNow;
        var slots = new List<DateTime>();

        // Iterate provider-local calendar days (with a one-day margin either
        // side so the UTC offset can't hide slots near the range boundaries).
        // Availability windows are wall-clock times in the provider's timezone.
        for (var day = fromDate.AddDays(-1); day <= toDate.AddDays(1); day = day.AddDays(1))
        {
            var dayOfWeek = (int)day.DayOfWeek;
            var windows = availability
                .Where(a => a.DayOfWeek == dayOfWeek)
                .Select(a => (a.StartTime, a.EndTime))
                .OrderBy(w => w.StartTime)
                .ToList();

            if (windows.Count == 0)
                windows = [(DefaultDayStart, DefaultDayEnd)];

            foreach (var (windowStart, windowEnd) in windows)
            {
                if (windowEnd <= windowStart)
                    continue;

                // A slot only needs to START within the window; the appointment
                // may run past the window end (e.g. a 1h service booked at 5:30
                // when the provider works until 6:00 ends at 6:30 and is allowed).
                var windowMinutes = (windowEnd - windowStart).TotalMinutes;

                for (var offset = 0.0; offset < windowMinutes; offset += stepMinutes)
                {
                    var localStart = day.ToDateTime(windowStart.AddMinutes(offset));
                    var startUtc = TimeZoneResolver.ToUtc(localStart, providerTz);
                    var endUtc = startUtc.AddMinutes(duration);

                    if (startUtc >= rangeStart &&
                        startUtc <= rangeEnd &&
                        startUtc >= nowUtc.AddMinutes(-1) &&
                        !HasOverlap(startUtc, endUtc, appointments))
                    {
                        slots.Add(startUtc);
                    }
                }
            }
        }

        slots.Sort();
        return (duration, slots);
    }

    private static bool HasOverlap(
        DateTime startUtc,
        DateTime endUtc,
        IEnumerable<TimeRange> appointments)
    {
        foreach (var appointment in appointments)
        {
            if (appointment.Start < endUtc && appointment.End > startUtc)
                return true;
        }

        return false;
    }

    private sealed class TimeRange
    {
        public DateTime Start { get; init; }
        public DateTime End { get; init; }
    }
}
