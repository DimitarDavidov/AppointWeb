namespace AppointWeb.Api.Services;

public static class AppointmentCustomerCancellationEmailBuilder
{
    private const string LogoContentId = "appointweb-logo";

    public static (string HtmlBody, string TextBody) Build(
        string providerName,
        string customerName,
        string serviceName,
        string appointmentWhen,
        string? reason)
    {
        providerName = CapitalizeFirstLetter(providerName);
        customerName = CapitalizeFirstLetter(customerName);

        var reasonText = string.IsNullOrWhiteSpace(reason)
            ? null
            : reason.Trim();

        var reasonTextBlock = reasonText is null
            ? string.Empty
            : $"""

              Reason from {customerName}:
              {reasonText}
              """;

        var reasonHtmlBlock = reasonText is null
            ? string.Empty
            : $"""
              <div style="margin:0 0 20px;padding:16px 18px;border-radius:12px;background-color:#f8fafc;border:1px solid #e2e8f0;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">
                  Reason from {HtmlEncode(customerName)}
                </p>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;white-space:pre-wrap;">{HtmlEncode(reasonText)}</p>
              </div>
              """;

        var textBody =
            $"""
            An AppointWeb appointment was cancelled

            Hi {providerName},

            {customerName} has cancelled their appointment for {serviceName} scheduled for {appointmentWhen}.
            {reasonTextBlock}

            You can review your appointments in your provider panel.
            """;

        var htmlBody = $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Appointment cancelled by customer</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(8,145,178,0.12);">
                      <tr>
                        <td style="padding:28px 32px 20px;text-align:center;background:linear-gradient(135deg,#fff1f2 0%,#fff7ed 45%,#fef2f2 100%);border-bottom:1px solid rgba(239,68,68,0.12);">
                          <img src="cid:{LogoContentId}" alt="AppointWeb" width="120" style="display:block;margin:0 auto 12px;border:0;outline:none;text-decoration:none;" />
                          <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#dc2626;">Appointment cancelled</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px;">
                          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#334155;">A customer cancelled their appointment</h1>
                          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#475569;">
                            Hi {HtmlEncode(providerName)},<br /><br />
                            <strong style="color:#334155;">{HtmlEncode(customerName)}</strong> has cancelled their
                            <strong style="color:#334155;">{HtmlEncode(serviceName)}</strong> appointment scheduled for
                            <strong style="color:#334155;">{HtmlEncode(appointmentWhen)}</strong>.
                          </p>
                          {reasonHtmlBlock}
                          <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                            You can review your appointments in your provider panel.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 32px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                          <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">
                            If you have questions, contact the customer directly.
                          </p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">
                      &copy; AppointWeb &mdash; Book appointments in one simple place.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;

        return (htmlBody, textBody);
    }

    public static void AttachLogo(MimeKit.BodyBuilder builder) =>
        PasswordResetEmailBuilder.AttachLogo(builder);

    private static string HtmlEncode(string value) =>
        System.Net.WebUtility.HtmlEncode(value);

    private static string CapitalizeFirstLetter(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "User";

        var trimmed = value.Trim();
        return char.ToUpperInvariant(trimmed[0]) + trimmed[1..];
    }
}
