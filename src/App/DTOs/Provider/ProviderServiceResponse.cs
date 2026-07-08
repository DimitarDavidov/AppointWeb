using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Provider;

public class ProviderServiceResponse
{
    public Guid ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public bool IsRemote { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
}
