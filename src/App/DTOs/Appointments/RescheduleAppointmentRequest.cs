using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Appointments;

public class RescheduleAppointmentRequest
{
    [Required]
    public DateTime StartTime { get; set; }
}
