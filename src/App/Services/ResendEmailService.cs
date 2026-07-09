using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using AppointWeb.Api.Options;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace AppointWeb.Api.Services;

/// <summary>
/// Sends transactional email via Resend's HTTPS API (port 443).
/// Works on Railway Free/Hobby plans where outbound SMTP is blocked.
/// </summary>
public class ResendEmailService : IEmailService
{
    private const string LogoContentId = "appointweb-logo";
    private static readonly Uri ResendApiUri = new("https://api.resend.com/emails");

    private readonly EmailSettings _settings;
    private readonly HttpClient _httpClient;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(
        IOptions<EmailSettings> settings,
        HttpClient httpClient,
        ILogger<ResendEmailService> logger)
    {
        _settings = settings.Value;
        _httpClient = httpClient;
        _logger = logger;
    }

    public Task SendPasswordResetEmailAsync(
        string toEmail,
        string resetLink,
        CancellationToken cancellationToken = default)
    {
        var (htmlBody, textBody) = PasswordResetEmailBuilder.Build(resetLink);
        return SendAsync(
            toEmail,
            "Reset your AppointWeb password",
            htmlBody,
            textBody,
            cancellationToken);
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
        var (htmlBody, textBody) = AppointmentCancellationEmailBuilder.Build(
            customerName,
            providerName,
            serviceName,
            appointmentWhen,
            reason);

        return SendAsync(
            toEmail,
            "Your AppointWeb appointment was cancelled",
            htmlBody,
            textBody,
            cancellationToken);
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
        var (htmlBody, textBody) = AppointmentRequestEmailBuilder.Build(
            providerName,
            customerName,
            customerPhoneNumber,
            serviceName,
            appointmentWhen,
            providerPanelUrl);

        return SendAsync(
            toEmail,
            "New AppointWeb appointment request",
            htmlBody,
            textBody,
            cancellationToken);
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
        var (htmlBody, textBody) = AppointmentCustomerCancellationEmailBuilder.Build(
            providerName,
            customerName,
            serviceName,
            appointmentWhen,
            reason);

        return SendAsync(
            toEmail,
            "AppointWeb appointment cancelled by customer",
            htmlBody,
            textBody,
            cancellationToken);
    }

    public Task SendCustomerRescheduledAppointmentEmailAsync(
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
        var (htmlBody, textBody) = AppointmentRescheduleEmailBuilder.BuildForProvider(
            providerName,
            customerName,
            serviceName,
            previousWhen,
            newWhen,
            previousRequestedWhen,
            reason,
            providerPanelUrl);

        return SendAsync(
            toEmail,
            "AppointWeb reschedule request from customer",
            htmlBody,
            textBody,
            cancellationToken);
    }

    public Task SendProviderRescheduledAppointmentEmailAsync(
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
        var (htmlBody, textBody) = AppointmentRescheduleEmailBuilder.BuildForCustomer(
            customerName,
            providerName,
            serviceName,
            previousWhen,
            newWhen,
            previousRequestedWhen,
            reason,
            appointmentsUrl);

        return SendAsync(
            toEmail,
            "AppointWeb reschedule request from your provider",
            htmlBody,
            textBody,
            cancellationToken);
    }

    public Task SendAppointmentConfirmedEmailAsync(
        string toEmail,
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string appointmentsUrl,
        CancellationToken cancellationToken = default)
    {
        var (htmlBody, textBody) = AppointmentConfirmedEmailBuilder.Build(
            customerName,
            providerName,
            serviceName,
            appointmentWhen,
            appointmentsUrl);

        return SendAsync(
            toEmail,
            "Your AppointWeb appointment is confirmed",
            htmlBody,
            textBody,
            cancellationToken);
    }

    public Task SendRescheduleAcceptedEmailAsync(
        string toEmail,
        string recipientName,
        string accepterName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string appointmentsUrl,
        CancellationToken cancellationToken = default)
    {
        var (htmlBody, textBody) = AppointmentRescheduleEmailBuilder.BuildAccepted(
            recipientName,
            accepterName,
            serviceName,
            previousWhen,
            newWhen,
            appointmentsUrl);

        return SendAsync(
            toEmail,
            "Your AppointWeb reschedule was accepted",
            htmlBody,
            textBody,
            cancellationToken);
    }

    private async Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string textBody,
        CancellationToken cancellationToken)
    {
        var payload = new ResendEmailRequest
        {
            From = FormatFromAddress(),
            To = [toEmail],
            Subject = subject,
            Html = htmlBody,
            Text = textBody,
            Attachments = BuildLogoAttachments()
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, ResendApiUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        request.Content = JsonContent.Create(payload);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
            return;

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        _logger.LogError(
            "Resend API failed with status {StatusCode} for {Email}: {Response}",
            (int)response.StatusCode,
            toEmail,
            body);

        response.EnsureSuccessStatusCode();
    }

    private string FormatFromAddress()
    {
        if (string.IsNullOrWhiteSpace(_settings.FromName))
            return _settings.FromAddress;

        return $"{_settings.FromName} <{_settings.FromAddress}>";
    }

    private static List<ResendAttachment>? BuildLogoAttachments()
    {
        var logoPath = Path.Combine(AppContext.BaseDirectory, "Assets", "logo.png");
        if (!File.Exists(logoPath))
            return null;

        return
        [
            new ResendAttachment
            {
                Filename = "logo.png",
                Content = Convert.ToBase64String(File.ReadAllBytes(logoPath)),
                ContentId = LogoContentId
            }
        ];
    }

    private sealed class ResendEmailRequest
    {
        [JsonPropertyName("from")]
        public string From { get; set; } = string.Empty;

        [JsonPropertyName("to")]
        public List<string> To { get; set; } = [];

        [JsonPropertyName("subject")]
        public string Subject { get; set; } = string.Empty;

        [JsonPropertyName("html")]
        public string Html { get; set; } = string.Empty;

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;

        [JsonPropertyName("attachments")]
        public List<ResendAttachment>? Attachments { get; set; }
    }

    private sealed class ResendAttachment
    {
        [JsonPropertyName("filename")]
        public string Filename { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("content_id")]
        public string ContentId { get; set; } = string.Empty;
    }
}
