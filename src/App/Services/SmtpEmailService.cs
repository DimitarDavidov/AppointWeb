using AppointWeb.Api.Options;
using AppointWeb.Api.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace AppointWeb.Api.Services;

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public SmtpEmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendPasswordResetEmailAsync(
        string toEmail,
        string resetLink,
        CancellationToken cancellationToken = default)
    {
        var message = BuildMessage(toEmail, resetLink);

        using var client = new SmtpClient();
        await client.ConnectAsync(
            _settings.Host,
            _settings.Port,
            _settings.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(_settings.Username))
        {
            await client.AuthenticateAsync(
                _settings.Username,
                _settings.Password,
                cancellationToken);
        }

        await client.SendAsync(message, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    private MimeMessage BuildMessage(string toEmail, string resetLink)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Reset your AppointWeb password";

        var body = new BodyBuilder
        {
            TextBody =
                $"We received a request to reset your AppointWeb password.\n\n" +
                $"Confirm it is you by opening this link (valid for 1 hour):\n{resetLink}\n\n" +
                "If you did not request this, you can ignore this email.",
            HtmlBody =
                $"""
                <p>We received a request to reset your AppointWeb password.</p>
                <p><a href="{resetLink}">Confirm it is you and reset your password</a></p>
                <p>This link is valid for 1 hour.</p>
                <p>If you did not request this, you can ignore this email.</p>
                """
        };

        message.Body = body.ToMessageBody();
        return message;
    }
}
