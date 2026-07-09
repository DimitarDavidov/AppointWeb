namespace AppointWeb.Api.Options;

public class EmailSettings
{

    public string ApiKey { get; set; } = string.Empty;

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromAddress { get; set; } = "noreply@appointweb.com";

    public string FromName { get; set; } = "AppointWeb";

    public bool UseSsl { get; set; } = true;
}
