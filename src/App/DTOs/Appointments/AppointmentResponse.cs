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
}