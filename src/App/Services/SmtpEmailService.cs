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

    public async Task SendAppointmentRequestEmailAsync(
        string toEmail,
        string providerName,
        string customerName,
        string? customerPhoneNumber,
        string serviceName,
        string appointmentWhen,
        string providerPanelUrl,
        CancellationToken cancellationToken = default)
    {
        var message = BuildAppointmentRequestMessage(
            toEmail,
            providerName,
            customerName,
            customerPhoneNumber,
            serviceName,
            appointmentWhen,
            providerPanelUrl);

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

    private MimeMessage BuildAppointmentRequestMessage(
        string toEmail,
        string providerName,
        string customerName,
        string? customerPhoneNumber,
        string serviceName,
        string appointmentWhen,
        string providerPanelUrl)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "New AppointWeb appointment request";

        var (htmlBody, textBody) = AppointmentRequestEmailBuilder.Build(
            providerName,
            customerName,
            customerPhoneNumber,
            serviceName,
            appointmentWhen,
            providerPanelUrl);

        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        AppointmentRequestEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }

    public async Task SendCustomerCancelledAppointmentEmailAsync(
        string toEmail,
        string providerName,
        string customerName,
        string serviceName,
        string appointmentWhen,
        string? reason,
        CancellationToken cancellationToken = default)
    {
        var message = BuildCustomerCancellationMessage(
            toEmail,
            providerName,
            customerName,
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

    private MimeMessage BuildCustomerCancellationMessage(
        string toEmail,
        string providerName,
        string customerName,
        string serviceName,
        string appointmentWhen,
        string? reason)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "AppointWeb appointment cancelled by customer";

        var (htmlBody, textBody) = AppointmentCustomerCancellationEmailBuilder.Build(
            providerName,
            customerName,
            serviceName,
            appointmentWhen,
            reason);

        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        AppointmentCustomerCancellationEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }

    public async Task SendCustomerRescheduledAppointmentEmailAsync(
        string toEmail,
        string providerName,
        string customerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string? previousRequestedWhen,
        string? reason,
        string providerPanelUrl,
        CancellationToken cancellationToken = default)
    {
        var message = BuildCustomerRescheduleMessage(
            toEmail,
            providerName,
            customerName,
            serviceName,
            previousWhen,
            newWhen,
            previousRequestedWhen,
            reason,
            providerPanelUrl);

        await SendMessageAsync(message, cancellationToken);
    }

    public async Task SendProviderRescheduledAppointmentEmailAsync(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string? previousRequestedWhen,
        string reason,
        string appointmentsUrl,
        CancellationToken cancellationToken = default)
    {
        var message = BuildProviderRescheduleMessage(
            toEmail,
            customerName,
            providerName,
            serviceName,
            previousWhen,
            newWhen,
            previousRequestedWhen,
            reason,
            appointmentsUrl);

        await SendMessageAsync(message, cancellationToken);
    }

    public async Task SendAppointmentConfirmedEmailAsync(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string appointmentsUrl,
        CancellationToken cancellationToken = default)
    {
        var message = BuildAppointmentConfirmedMessage(
            toEmail,
            customerName,
            providerName,
            serviceName,
            appointmentWhen,
            appointmentsUrl);

        await SendMessageAsync(message, cancellationToken);
    }

    public async Task SendRescheduleAcceptedEmailAsync(
        string toEmail,
        string recipientName,
        string accepterName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string appointmentsUrl,
        CancellationToken cancellationToken = default)
    {
        var message = BuildRescheduleAcceptedMessage(
            toEmail,
            recipientName,
            accepterName,
            serviceName,
            previousWhen,
            newWhen,
            appointmentsUrl);

        await SendMessageAsync(message, cancellationToken);
    }

    private async Task SendMessageAsync(MimeMessage message, CancellationToken cancellationToken)
    {
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

    private MimeMessage BuildCustomerRescheduleMessage(
        string toEmail,
        string providerName,
        string customerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string? previousRequestedWhen,
        string? reason,
        string providerPanelUrl)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "AppointWeb reschedule request from customer";

        var (htmlBody, textBody) = AppointmentRescheduleEmailBuilder.BuildForProvider(
            providerName,
            customerName,
            serviceName,
            previousWhen,
            newWhen,
            previousRequestedWhen,
            reason,
            providerPanelUrl);

        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        AppointmentRescheduleEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }

    private MimeMessage BuildProviderRescheduleMessage(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string? previousRequestedWhen,
        string reason,
        string appointmentsUrl)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "AppointWeb reschedule request from your provider";

        var (htmlBody, textBody) = AppointmentRescheduleEmailBuilder.BuildForCustomer(
            customerName,
            providerName,
            serviceName,
            previousWhen,
            newWhen,
            previousRequestedWhen,
            reason,
            appointmentsUrl);

        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        AppointmentRescheduleEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }

    private MimeMessage BuildAppointmentConfirmedMessage(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string appointmentsUrl)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Your AppointWeb appointment is confirmed";

        var (htmlBody, textBody) = AppointmentConfirmedEmailBuilder.Build(
            customerName,
            providerName,
            serviceName,
            appointmentWhen,
            appointmentsUrl);

        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        AppointmentConfirmedEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }

    private MimeMessage BuildRescheduleAcceptedMessage(
        string toEmail,
        string recipientName,
        string accepterName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string appointmentsUrl)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "Your AppointWeb reschedule was accepted";

        var (htmlBody, textBody) = AppointmentRescheduleEmailBuilder.BuildAccepted(
            recipientName,
            accepterName,
            serviceName,
            previousWhen,
            newWhen,
            appointmentsUrl);

        var body = new BodyBuilder
        {
            TextBody = textBody,
            HtmlBody = htmlBody
        };

        AppointmentRescheduleEmailBuilder.AttachLogo(body);

        message.Body = body.ToMessageBody();
        return message;
    }
}
