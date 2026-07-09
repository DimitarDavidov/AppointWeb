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
        var context = await LoadOfferingContextAsync(providerId, serviceId, ct);
        if (context is null)
            return null;

        var fromDate = DateOnly.FromDateTime(fromUtc);
        var toDate = DateOnly.FromDateTime(toUtc);

        if (toDate < fromDate)
            return (context.DurationMinutes, []);

        if (toDate.DayNumber - fromDate.DayNumber > MaxRangeDays)
            toDate = fromDate.AddDays(MaxRangeDays);

        var availability = await LoadAvailabilityAsync(providerId, serviceId, ct);
        var hasAvailabilityRules = availability.Count > 0;

        // Only return slots whose UTC start falls inside the requested range.
        var rangeStart = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var rangeEnd = toDate.ToDateTime(new TimeOnly(23, 59, 59), DateTimeKind.Utc);

        // Appointments are fetched with a one-day margin so overlaps near the
        // range edges (and across the provider's UTC offset) are still caught.
        var apptFrom = rangeStart.AddDays(-1);
        var apptTo = rangeEnd.AddDays(1);

        var appointments = await LoadActiveAppointmentsAsync(
            providerId,
            apptFrom,
            apptTo,
            excludeAppointmentId: null,
            ct);

        var stepMinutes = GetStepMinutes(context.DurationMinutes);
        var nowUtc = DateTime.UtcNow;
        var slots = new List<DateTime>();

        // Iterate provider-local calendar days (with a one-day margin either
        // side so the UTC offset can't hide slots near the range boundaries).
        // Availability windows are wall-clock times in the provider's timezone.
        for (var day = fromDate.AddDays(-1); day <= toDate.AddDays(1); day = day.AddDays(1))
        {
            if (!TryGetWindowsForDay(
                    availability,
                    hasAvailabilityRules,
                    day,
                    out var windows))
            {
                continue;
            }

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
                    var startUtc = TimeZoneResolver.ToUtc(localStart, context.ProviderTz);
                    var endUtc = startUtc.AddMinutes(context.DurationMinutes);

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
        return (context.DurationMinutes, slots);
    }

    public async Task<bool> IsStartTimeAvailableAsync(
        Guid providerId,
        Guid serviceId,
        DateTime startUtc,
        Guid? excludeAppointmentId,
        CancellationToken ct)
    {
        var context = await LoadOfferingContextAsync(providerId, serviceId, ct);
        if (context is null)
            return false;

        if (startUtc < DateTime.UtcNow.AddMinutes(-1))
            return false;

        var availability = await LoadAvailabilityAsync(providerId, serviceId, ct);
        var hasAvailabilityRules = availability.Count > 0;

        if (!IsBookableStartTime(
                startUtc,
                context,
                availability,
                hasAvailabilityRules))
        {
            return false;
        }

        var endUtc = startUtc.AddMinutes(context.DurationMinutes);

        return !await HasAppointmentOverlapAsync(
            providerId,
            startUtc,
            endUtc,
            excludeAppointmentId,
            ct);
    }

    private async Task<OfferingContext?> LoadOfferingContextAsync(
        Guid providerId,
        Guid serviceId,
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

        return new OfferingContext
        {
            DurationMinutes = offering.DurationMinutes,
            ProviderTz = TimeZoneResolver.Resolve(offering.TimeZoneId),
        };
    }

    private Task<List<ProviderAvailability>> LoadAvailabilityAsync(
        Guid providerId,
        Guid serviceId,
        CancellationToken ct)
    {
        return _db.ProviderAvailabilities
            .AsNoTracking()
            .Where(a => a.ProviderId == providerId && a.ServiceId == serviceId)
            .ToListAsync(ct);
    }

    private async Task<List<TimeRange>> LoadActiveAppointmentsAsync(
        Guid providerId,
        DateTime fromUtc,
        DateTime toUtc,
        Guid? excludeAppointmentId,
        CancellationToken ct)
    {
        var query = _db.Appointments
            .AsNoTracking()
            .Where(a =>
                a.ProviderId == providerId &&
                (a.Status == AppointmentStatus.Booked || a.Status == AppointmentStatus.Pending) &&
                a.StartTime < toUtc &&
                a.EndTime > fromUtc);

        if (excludeAppointmentId is not null)
            query = query.Where(a => a.Id != excludeAppointmentId.Value);

        return await query
            .Select(a => new TimeRange { Start = a.StartTime, End = a.EndTime })
            .ToListAsync(ct);
    }

    private async Task<bool> HasAppointmentOverlapAsync(
        Guid providerId,
        DateTime startUtc,
        DateTime endUtc,
        Guid? excludeAppointmentId,
        CancellationToken ct)
    {
        var appointments = await LoadActiveAppointmentsAsync(
            providerId,
            startUtc,
            endUtc,
            excludeAppointmentId,
            ct);

        return HasOverlap(startUtc, endUtc, appointments);
    }

    private static int GetStepMinutes(int durationMinutes) =>
        durationMinutes >= 30 ? durationMinutes : 15;

    private static bool TryGetWindowsForDay(
        IReadOnlyList<ProviderAvailability> availability,
        bool hasAvailabilityRules,
        DateOnly day,
        out List<(TimeOnly Start, TimeOnly End)> windows)
    {
        var dayOfWeek = (int)day.DayOfWeek;
        windows = availability
            .Where(a => a.DayOfWeek == dayOfWeek)
            .Select(a => (a.StartTime, a.EndTime))
            .OrderBy(w => w.StartTime)
            .ToList();

        if (windows.Count > 0)
            return true;

        if (!hasAvailabilityRules)
        {
            windows = [(DefaultDayStart, DefaultDayEnd)];
            return true;
        }

        return false;
    }

    private static bool IsBookableStartTime(
        DateTime startUtc,
        OfferingContext context,
        IReadOnlyList<ProviderAvailability> availability,
        bool hasAvailabilityRules)
    {
        var localStart = TimeZoneResolver.ToLocal(startUtc, context.ProviderTz);
        var localDay = DateOnly.FromDateTime(localStart);

        if (!TryGetWindowsForDay(availability, hasAvailabilityRules, localDay, out var windows))
            return false;

        var startTime = TimeOnly.FromDateTime(localStart);
        var stepMinutes = GetStepMinutes(context.DurationMinutes);

        foreach (var (windowStart, windowEnd) in windows)
        {
            if (windowEnd <= windowStart)
                continue;

            if (startTime < windowStart || startTime >= windowEnd)
                continue;

            var minutesFromWindowStart = (startTime - windowStart).TotalMinutes;
            if (minutesFromWindowStart % stepMinutes != 0)
                continue;

            return true;
        }

        return false;
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

    private sealed class OfferingContext
    {
        public int DurationMinutes { get; init; }
        public TimeZoneInfo ProviderTz { get; init; } = TimeZoneInfo.Utc;
    }

    private sealed class TimeRange
    {
        public DateTime Start { get; init; }
        public DateTime End { get; init; }
    }
}
