using AppointWeb.Api.Models;

namespace AppointWeb.Api.Dtos.Appointments;

public static class AppointmentStatusMapper
{
    public static string ToApiStatus(AppointmentStatus status) =>
        status switch
        {
            AppointmentStatus.Booked => "Booked",
            AppointmentStatus.Cancelled => "Cancelled",
            AppointmentStatus.Completed => "Completed",
            AppointmentStatus.NoShow => "NoShow",
            AppointmentStatus.Pending => "Pending",
            _ => status.ToString(),
        };

    public static bool BlocksScheduling(AppointmentStatus status) =>
        status is AppointmentStatus.Booked or AppointmentStatus.Pending;

    public static bool CanBeModified(AppointmentStatus status) =>
        status is AppointmentStatus.Booked or AppointmentStatus.Pending;
}
