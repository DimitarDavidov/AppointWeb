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
}
