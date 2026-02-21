using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Appointments;

public class CreateAppointmentRequest
{
    [Required]
    public Guid ProviderId { get; set; }

    [Required]
    public Guid ServiceId { get; set; }

    [Required]
    public DateTime StartTime { get; set; }
}