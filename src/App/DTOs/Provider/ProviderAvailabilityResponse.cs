namespace AppointWeb.Api.Dtos.Provider;

public class ProviderAvailabilityResponse
{
    public Guid Id { get; set; }
    public int DayOfWeek { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
}
