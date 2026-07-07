namespace AppointWeb.Api.Dtos.Appointments;

public class AppointmentResponse
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid ProviderId { get; set; }
    public Guid ServiceId { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public string Status { get; set; } = "Booked";
    public decimal PriceAtBooking { get; set; }
    public string? CancellationReason { get; set; }

    public DateTime? PendingRescheduleStartTime { get; set; }
    public DateTime? PendingRescheduleEndTime { get; set; }
    public string? RescheduleReason { get; set; }
    public Guid? RescheduleRequestedByUserId { get; set; }
}