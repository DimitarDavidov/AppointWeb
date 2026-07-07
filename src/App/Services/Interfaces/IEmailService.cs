namespace AppointWeb.Api.Services.Interfaces;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(
        string toEmail,
        string resetLink,
        CancellationToken cancellationToken = default);

    Task SendAppointmentCancelledEmailAsync(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string? reason,
        CancellationToken cancellationToken = default);
}
