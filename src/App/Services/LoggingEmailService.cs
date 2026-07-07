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

    public Task SendAppointmentRequestEmailAsync(
        string toEmail,
        string providerName,
        string customerName,
        string? customerPhoneNumber,
        string serviceName,
        string appointmentWhen,
        string providerPanelUrl,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            """
            Email:Host is not configured. New appointment request email for {Email}:
            Provider: {ProviderName}
            Customer: {CustomerName}
            Customer phone: {CustomerPhoneNumber}
            Service: {ServiceName}
            When: {AppointmentWhen}
            Provider panel: {ProviderPanelUrl}
            """,
            toEmail,
            providerName,
            customerName,
            customerPhoneNumber ?? "(none)",
            serviceName,
            appointmentWhen,
            providerPanelUrl);

        return Task.CompletedTask;
    }

    public Task SendCustomerCancelledAppointmentEmailAsync(
        string toEmail,
        string providerName,
        string customerName,
        string serviceName,
        string appointmentWhen,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            """
            Email:Host is not configured. Customer cancellation email for {Email}:
            Provider: {ProviderName}
            Customer: {CustomerName}
            Service: {ServiceName}
            When: {AppointmentWhen}
            Reason: {Reason}
            """,
            toEmail,
            providerName,
            customerName,
            serviceName,
            appointmentWhen,
            reason ?? "(none)");

        return Task.CompletedTask;
    }

    public Task SendCustomerRescheduledAppointmentEmailAsync(
        string toEmail,
        string providerName,
        string customerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string? reason,
        string providerPanelUrl,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            """
            Email:Host is not configured. Customer reschedule email for {Email}:
            Provider: {ProviderName}
            Customer: {CustomerName}
            Service: {ServiceName}
            Previous: {PreviousWhen}
            New: {NewWhen}
            Reason: {Reason}
            Provider panel: {ProviderPanelUrl}
            """,
            toEmail,
            providerName,
            customerName,
            serviceName,
            previousWhen,
            newWhen,
            reason ?? "(none)",
            providerPanelUrl);

        return Task.CompletedTask;
    }

    public Task SendProviderRescheduledAppointmentEmailAsync(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string reason,
        string appointmentsUrl,
        CancellationToken cancellationToken = default)
    {
        _logger.LogWarning(
            """
            Email:Host is not configured. Provider reschedule email for {Email}:
            Customer: {CustomerName}
            Provider: {ProviderName}
            Service: {ServiceName}
            Previous: {PreviousWhen}
            New: {NewWhen}
            Reason: {Reason}
            Appointments: {AppointmentsUrl}
            """,
            toEmail,
            customerName,
            providerName,
            serviceName,
            previousWhen,
            newWhen,
            reason,
            appointmentsUrl);

        return Task.CompletedTask;
    }
}
