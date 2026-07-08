namespace AppointWeb.Api.Models;

public class ProviderAvailability
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProviderId { get; set; }

    public Guid ServiceId { get; set; }

    /// <summary>
    /// Day of week (0 = Sunday through 6 = Saturday), matches <see cref="DayOfWeek"/>.
    /// </summary>
    public int DayOfWeek { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public User Provider { get; set; } = null!;
    public Service Service { get; set; } = null!;
}
