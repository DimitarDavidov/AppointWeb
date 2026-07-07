using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Appointments;

public class UpdateAppointmentStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
