namespace AppointWeb.Api.Services;

public static class AppointmentConfirmedEmailBuilder
{
    private const string LogoContentId = "appointweb-logo";

    public static (string HtmlBody, string TextBody) Build(
        string customerName,
        string providerName,
        string serviceName,
        string appointmentWhen,
        string appointmentsUrl)
    {
        customerName = CapitalizeFirstLetter(customerName);
        providerName = CapitalizeFirstLetter(providerName);

        var textBody =
            $"""
            AppointWeb appointment confirmed

            Hi {customerName},

            {providerName} has confirmed your {serviceName} appointment for {appointmentWhen}.

            View your appointments:
            {appointmentsUrl}
            """;

        var htmlBody = $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Appointment confirmed</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(8,145,178,0.12);">
                      <tr>
                        <td style="padding:28px 32px 20px;text-align:center;background:linear-gradient(135deg,#f0fdfa 0%,#ecfeff 45%,#cffafe 100%);border-bottom:1px solid rgba(8,145,178,0.12);">
                          <img src="cid:{LogoContentId}" alt="AppointWeb" width="120" style="display:block;margin:0 auto 12px;border:0;outline:none;text-decoration:none;" />
                          <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#0891b2;">Appointment confirmed</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px;">
                          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#334155;">Your appointment is confirmed</h1>
                          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#475569;">
                            Hi {HtmlEncode(customerName)},<br /><br />
                            <strong style="color:#334155;">{HtmlEncode(providerName)}</strong> has confirmed your
                            <strong style="color:#334155;">{HtmlEncode(serviceName)}</strong> appointment for
                            <strong style="color:#334155;">{HtmlEncode(appointmentWhen)}</strong>.
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                            <tr>
                              <td style="border-radius:10px;background-color:#0891b2;">
                                <a href="{appointmentsUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                                  View appointments
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                            Your booking is confirmed. See you at your appointment time.
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
