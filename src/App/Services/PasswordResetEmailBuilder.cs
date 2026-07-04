using MimeKit;

namespace AppointWeb.Api.Services;

public static class PasswordResetEmailBuilder
{
    private const string LogoContentId = "appointweb-logo";

    public static (string HtmlBody, string TextBody) Build(string resetLink)
    {
        var textBody =
            $"""
            Reset your AppointWeb password

            We received a request to reset your password. Open the link below to choose a new one (valid for 1 hour):

            {resetLink}

            If you did not request this, you can safely ignore this email.
            """;

        var htmlBody = $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Reset your AppointWeb password</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#334155;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:32px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(8,145,178,0.12);">
                      <tr>
                        <td style="padding:28px 32px 20px;text-align:center;background:linear-gradient(135deg,#f0fdfa 0%,#ecfeff 45%,#cffafe 100%);border-bottom:1px solid rgba(8,145,178,0.12);">
                          <img src="cid:{LogoContentId}" alt="AppointWeb" width="120" style="display:block;margin:0 auto 12px;border:0;outline:none;text-decoration:none;" />
                          <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#0891b2;">Password reset</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px;">
                          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#334155;">Reset your password</h1>
                          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#475569;">
                            We received a request to reset the password for your AppointWeb account.
                            Click the button below to confirm it&apos;s you and choose a new password.
                          </p>
                          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                            <tr>
                              <td style="border-radius:10px;background-color:#0891b2;">
                                <a href="{resetLink}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                                  Reset password
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#64748b;">
                            This link expires in <strong style="color:#334155;">1 hour</strong> and can only be used once.
                          </p>
                          <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                            If the button doesn&apos;t work, copy and paste this link into your browser:
                          </p>
                          <p style="margin:8px 0 0;font-size:13px;line-height:1.5;word-break:break-all;">
                            <a href="{resetLink}" style="color:#0891b2;text-decoration:underline;">{resetLink}</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 32px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                          <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">
                            If you did not request a password reset, you can safely ignore this email.
                            Your password will stay the same.
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

    public static void AttachLogo(BodyBuilder builder)
    {
        var logoPath = Path.Combine(AppContext.BaseDirectory, "Assets", "logo.png");
        if (!File.Exists(logoPath))
            return;

        var logo = builder.LinkedResources.Add(logoPath);
        logo.ContentId = LogoContentId;
    }
}
