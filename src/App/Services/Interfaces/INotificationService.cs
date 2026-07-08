using AppointWeb.Api.Models;

namespace AppointWeb.Api.Services.Interfaces;

public interface INotificationService
{
    Task NotifyAppointmentCancelledAsync(
        Appointment appointment,
        Guid recipientUserId,
        string cancelledByUsername,
        CancellationToken cancellationToken = default);

    Task NotifyAppointmentConfirmedAsync(
        Appointment appointment,
        CancellationToken cancellationToken = default);

    Task NotifyRescheduleReceivedAsync(
        Appointment appointment,
        Guid recipientUserId,
        string requestedByUsername,
        DateTime proposedStartUtc,
        CancellationToken cancellationToken = default);

    Task NotifyRescheduleAcceptedAsync(
        Appointment appointment,
        Guid recipientUserId,
        string accepterUsername,
        DateTime previousStartUtc,
        DateTime newStartUtc,
        CancellationToken cancellationToken = default);
}
