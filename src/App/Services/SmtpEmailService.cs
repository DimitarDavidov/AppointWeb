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

        var (htmlBody, textBody) = PasswordResetEmailBuilder.Build(resetLink);
        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        PasswordResetEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }

    public async Task SendAppointmentCancelledEmailAsync(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var message = BuildCancellationMessage(
            toEmail,
            customerName,
            providerName,
            serviceName,
            appointmentWhen,
            reason);

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

    private MimeMessage BuildCancellationMessage(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string? reason)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Your AppointWeb appointment was cancelled";

        var (htmlBody, textBody) = AppointmentCancellationEmailBuilder.Build(
            customerName,
            providerName,
            serviceName,
            appointmentWhen,
            reason);

        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        AppointmentCancellationEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }
}
