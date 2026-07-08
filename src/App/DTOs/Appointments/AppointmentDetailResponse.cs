namespace AppointWeb.Api.Dtos.Appointments;

public class AppointmentDetailResponse
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerUsername { get; set; } = string.Empty;
    public string? CustomerPhoneNumber { get; set; }
    public Guid ProviderId { get; set; }
    public string ProviderUsername { get; set; } = string.Empty;
    public Guid ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime CreatedAt { get; set; }

    public string Status { get; set; } = "Booked";
    public decimal PriceAtBooking { get; set; }
    public string? CancellationReason { get; set; }
    public Guid? CancelledByUserId { get; set; }

    public DateTime? PendingRescheduleStartTime { get; set; }
    public DateTime? PendingRescheduleEndTime { get; set; }
    public DateTime? CounteredRescheduleStartTime { get; set; }
    public string? RescheduleReason { get; set; }
    public Guid? RescheduleRequestedByUserId { get; set; }
    public int ProviderRescheduleCount { get; set; }
    public int CustomerRescheduleCount { get; set; }
    public DateTime? PreviousStartTime { get; set; }
}
