namespace AppointWeb.Api.Dtos.Admin;

/// <summary>
/// A cancelled appointment cancelled by a given user, used for CSV export.
/// </summary>
public class AdminCancelledAppointmentResponse
{
    public Guid Id { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string CustomerUsername { get; set; } = string.Empty;
    public string ProviderUsername { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal PriceAtBooking { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
}
