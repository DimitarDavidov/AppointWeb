using AppointWeb.Api.Services.Interfaces;

namespace AppointWeb.Api.Services;

public class LoggingEmailService : IEmailService
{
    private readonly ILogger<LoggingEmailService> _logger;

    public LoggingEmailService(ILogger<LoggingEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendPasswordResetEmailAsync(
        string toEmail,
        string resetLink,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            "Email:Host is not configured. Password reset email for {Email}: {ResetLink}",
            toEmail,
            resetLink);

        return Task.CompletedTask;
    }

    public Task SendAppointmentCancelledEmailAsync(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            """
            Email:Host is not configured. Appointment cancellation email for {Email}:
            Customer: {CustomerName}
            Provider: {ProviderName}
            Service: {ServiceName}
            When: {AppointmentWhen}
            Reason: {Reason}
            """,
            toEmail,
            customerName,
            providerName,
            serviceName,
            appointmentWhen,
            reason ?? "(none)");

        return Task.CompletedTask;
    }
}
