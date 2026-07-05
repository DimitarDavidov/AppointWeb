using AppointWeb.Api.Models;

namespace AppointWeb.Api.Dtos.Appointments;

public static class AppointmentMapper
{
    public static AppointmentResponse MapResponse(Appointment appointment) =>
        new()
        {
            Id = appointment.Id,
            CustomerId = appointment.CustomerId,
            ProviderId = appointment.ProviderId,
            ServiceId = appointment.ServiceId,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status.ToString(),
            PriceAtBooking = appointment.PriceAtBooking,
        };
}
