namespace AppointWeb.Api.Services;


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

    public static DateTime ToUtc(DateTime unspecifiedLocal, TimeZoneInfo tz)
    {
        var local = DateTime.SpecifyKind(unspecifiedLocal, DateTimeKind.Unspecified);

        if (tz.IsInvalidTime(local))
        {
           
            local = local.AddHours(1);
        }

        return TimeZoneInfo.ConvertTimeToUtc(local, tz);
    }

    public static DateTime ToLocal(DateTime utc, TimeZoneInfo tz)
    {
        var utcInstant = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
        return TimeZoneInfo.ConvertTimeFromUtc(utcInstant, tz);
    }
}
