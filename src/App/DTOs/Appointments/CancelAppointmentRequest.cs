using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Appointments;

public class CancelAppointmentRequest
{
    [MaxLength(1000)]
    public string? Reason { get; set; }
}
