namespace AppointWeb.Api.Services;

/// <summary>
/// Resolves stored IANA timezone ids into <see cref="TimeZoneInfo"/> and
/// converts between a user's local wall-clock time and UTC. Falls back to UTC
/// for unknown or invalid ids so a bad value can never break slot generation.
/// </summary>
public static class TimeZoneResolver
{
    public static TimeZoneInfo Resolve(string? timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
            return TimeZoneInfo.Utc;

        return TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out var tz)
            ? tz
            : TimeZoneInfo.Utc;
    }

    public static bool IsValid(string? timeZoneId) =>
        !string.IsNullOrWhiteSpace(timeZoneId) &&
        TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out _);

    /// <summary>
    /// Converts a wall-clock local time in the given zone to a UTC instant.
    /// Handles invalid (spring-forward gap) and ambiguous (fall-back) times
    /// gracefully instead of throwing.
    /// </summary>
    public static DateTime ToUtc(DateTime unspecifiedLocal, TimeZoneInfo tz)
    {
        var local = DateTime.SpecifyKind(unspecifiedLocal, DateTimeKind.Unspecified);

        if (tz.IsInvalidTime(local))
        {
            // During a spring-forward gap this wall-clock time doesn't exist;
            // nudge forward by the DST delta (typically one hour) to a real time.
            local = local.AddHours(1);
        }

        return TimeZoneInfo.ConvertTimeToUtc(local, tz);
    }

    /// <summary>
    /// Converts a UTC instant to the wall-clock local time in the given zone.
    /// </summary>
    public static DateTime ToLocal(DateTime utc, TimeZoneInfo tz)
    {
        var utcInstant = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utcInstant, tz);
    }
}
