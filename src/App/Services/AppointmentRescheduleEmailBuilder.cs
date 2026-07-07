namespace AppointWeb.Api.Services;

public static class AppointmentRescheduleEmailBuilder
{
    private const string LogoContentId = "appointweb-logo";

    public static (string HtmlBody, string TextBody) BuildForProvider(
        string providerName,
        string customerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string? reason,
        string providerPanelUrl)
    {
        providerName = CapitalizeFirstLetter(providerName);
        customerName = CapitalizeFirstLetter(customerName);

        var (reasonTextBlock, reasonHtmlBlock) = BuildReasonBlocks(
            customerName,
            reason,
            required: false);

        var textBody =
            $"""
            AppointWeb reschedule request

            Hi {providerName},

            {customerName} has requested to reschedule their {serviceName} appointment.

            Current time: {previousWhen}
            Requested new time: {newWhen}
            {reasonTextBlock}

            Review the request in your provider panel:
            {providerPanelUrl}
            """;

        var htmlBody = BuildHtml(
            heading: "A customer requested a reschedule",
            badgeText: "Reschedule request",
            greetingName: providerName,
            bodyHtml: $"""
                <strong style="color:#334155;">{HtmlEncode(customerName)}</strong> has requested to reschedule their
                <strong style="color:#334155;">{HtmlEncode(serviceName)}</strong> appointment.
                """,
            previousWhen,
            newWhen,
            reasonHtmlBlock,
            footerHtml: $"""
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:10px;background-color:#0891b2;">
                      <a href="{providerPanelUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Review in provider panel
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                  Open your provider panel to review this reschedule request.
                </p>
                """);

        return (htmlBody, textBody);
    }

    public static (string HtmlBody, string TextBody) BuildForCustomer(
        string customerName,
        string providerName,
        string serviceName,
        string previousWhen,
        string newWhen,
        string reason,
        string appointmentsUrl)
    {
        customerName = CapitalizeFirstLetter(customerName);
        providerName = CapitalizeFirstLetter(providerName);

        var (reasonTextBlock, reasonHtmlBlock) = BuildReasonBlocks(
            providerName,
            reason,
            required: true);

        var textBody =
            $"""
            AppointWeb reschedule request

            Hi {customerName},

            {providerName} has requested to reschedule your {serviceName} appointment.

            Current time: {previousWhen}
            Requested new time: {newWhen}
            {reasonTextBlock}

            View your appointments:
            {appointmentsUrl}
            """;

        var htmlBody = BuildHtml(
            heading: "Your provider requested a reschedule",
            badgeText: "Reschedule request",
            greetingName: customerName,
            bodyHtml: $"""
                <strong style="color:#334155;">{HtmlEncode(providerName)}</strong> has requested to reschedule your
                <strong style="color:#334155;">{HtmlEncode(serviceName)}</strong> appointment.
                """,
            previousWhen,
            newWhen,
            reasonHtmlBlock,
            footerHtml: $"""
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
                  Review the request in your appointments. Contact your provider if you have questions.
                </p>
                """);

        return (htmlBody, textBody);
    }

    public static void AttachLogo(MimeKit.BodyBuilder builder) =>
        PasswordResetEmailBuilder.AttachLogo(builder);

    private static (string TextBlock, string HtmlBlock) BuildReasonBlocks(
        string fromName,
        string? reason,
        bool required)
    {
        var reasonText = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();

        if (reasonText is null)
        {
            return required
                ? (string.Empty, string.Empty)
                : (string.Empty, string.Empty);
        }

        var textBlock =
            $"""

            Reason from {fromName}:
            {reasonText}
            """;

        var htmlBlock = $"""
            <div style="margin:0 0 20px;padding:16px 18px;border-radius:12px;background-color:#f8fafc;border:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">
                Reason from {HtmlEncode(fromName)}
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;white-space:pre-wrap;">{HtmlEncode(reasonText)}</p>
            </div>
            """;

        return (textBlock, htmlBlock);
    }

    private static string BuildHtml(
        string heading,
        string badgeText,
        string greetingName,
        string bodyHtml,
        string previousWhen,
        string newWhen,
        string reasonHtmlBlock,
        string footerHtml)
    {
        return $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>{HtmlEncode(heading)}</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(8,145,178,0.12);">
                      <tr>
                        <td style="padding:28px 32px 20px;text-align:center;background:linear-gradient(135deg,#f0fdfa 0%,#ecfeff 45%,#cffafe 100%);border-bottom:1px solid rgba(8,145,178,0.12);">
                          <img src="cid:{LogoContentId}" alt="AppointWeb" width="120" style="display:block;margin:0 auto 12px;border:0;outline:none;text-decoration:none;" />
                          <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#0891b2;">{HtmlEncode(badgeText)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px;">
                          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#334155;">{HtmlEncode(heading)}</h1>
                          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#475569;">
                            Hi {HtmlEncode(greetingName)},<br /><br />
                            {bodyHtml}
                          </p>
                          <div style="margin:0 0 20px;padding:16px 18px;border-radius:12px;background-color:#f8fafc;border:1px solid #e2e8f0;">
                            <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#475569;">
                              <strong style="color:#334155;">Current time:</strong> {HtmlEncode(previousWhen)}
                            </p>
                            <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
                              <strong style="color:#334155;">Requested new time:</strong> {HtmlEncode(newWhen)}
                            </p>
                          </div>
                          {reasonHtmlBlock}
                          {footerHtml}
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
    }

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
