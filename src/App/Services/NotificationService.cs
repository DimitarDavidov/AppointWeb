using System.Globalization;
using AppointWeb.Api.Data;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services.Interfaces;

namespace AppointWeb.Api.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db)
    {
        _db = db;
    }

    public Task NotifyAppointmentCancelledAsync(
        Appointment appointment,
        Guid recipientUserId,
        string cancelledByUsername,
        CancellationToken cancellationToken = default)
    {
        var when = FormatWhen(appointment.StartTime);
        var otherParty = Capitalize(cancelledByUsername);

        return CreateAsync(
            recipientUserId,
            NotificationType.AppointmentCancelled,
            "Appointment cancelled",
            $"{otherParty} cancelled your {appointment.Service.Name} appointment scheduled for {when}.",
            appointment.Id,
            cancellationToken);
    }

    public Task NotifyAppointmentConfirmedAsync(
        Appointment appointment,
        CancellationToken cancellationToken = default)
    {
        var when = FormatWhen(appointment.StartTime);
        var provider = Capitalize(appointment.Provider.Username);

        return CreateAsync(
            appointment.CustomerId,
            NotificationType.AppointmentConfirmed,
            "Appointment confirmed",
            $"{provider} confirmed your {appointment.Service.Name} appointment for {when}.",
            appointment.Id,
            cancellationToken);
    }

    public Task NotifyRescheduleReceivedAsync(
        Appointment appointment,
        Guid recipientUserId,
        string requestedByUsername,
        DateTime proposedStartUtc,
        CancellationToken cancellationToken = default)
    {
        var otherParty = Capitalize(requestedByUsername);
        var newWhen = FormatWhen(proposedStartUtc);

        return CreateAsync(
            recipientUserId,
            NotificationType.RescheduleReceived,
            "Reschedule request received",
            $"{otherParty} requested to reschedule your {appointment.Service.Name} appointment to {newWhen}.",
            appointment.Id,
            cancellationToken);
    }

    public Task NotifyRescheduleAcceptedAsync(
        Appointment appointment,
        Guid recipientUserId,
        string accepterUsername,
        DateTime previousStartUtc,
        DateTime newStartUtc,
        CancellationToken cancellationToken = default)
    {
        var otherParty = Capitalize(accepterUsername);
        var newWhen = FormatWhen(newStartUtc);

        return CreateAsync(
            recipientUserId,
            NotificationType.RescheduleAccepted,
            "Reschedule accepted",
            $"{otherParty} accepted your reschedule request for {appointment.Service.Name}. New time: {newWhen}.",
            appointment.Id,
            cancellationToken);
    }

    private async Task CreateAsync(
        Guid userId,
        string type,
        string title,
        string message,
        Guid appointmentId,
        CancellationToken cancellationToken)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            AppointmentId = appointmentId,
        });

        await _db.SaveChangesAsync(cancellationToken);
    }

    private static string FormatWhen(DateTime utc) =>
        utc.ToString("dddd, MMMM d, yyyy 'at' h:mm tt 'UTC'", CultureInfo.InvariantCulture);

    private static string Capitalize(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "User";

        var trimmed = value.Trim();
        return char.ToUpperInvariant(trimmed[0]) + trimmed[1..];
    }
}
