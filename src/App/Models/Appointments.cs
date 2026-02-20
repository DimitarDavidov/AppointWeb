using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Models;




public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid CustomerId { get; set; }

    [Required]
    public Guid ProviderId { get; set; }

    [Required]
    public Guid ServiceId { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    [Required]
    public DateTime EndTime { get; set; }

    [Required]
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Booked;

    public decimal PriceAtBooking { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Customer { get; set; } = null!;
    public User Provider { get; set; } = null!;
    public Service Service { get; set; } = null!;
}