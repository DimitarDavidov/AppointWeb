using Npgsql;

namespace AppointWeb.Api.Extensions;

public static class ConnectionStringResolver
{
    public static string? Resolve(IConfiguration configuration)
    {
        var value =
            configuration.GetConnectionString("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DATABASE_PRIVATE_URL")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL");

        if (!string.IsNullOrWhiteSpace(value))
            return Normalize(value);

        var host = Environment.GetEnvironmentVariable("PGHOST");
        if (string.IsNullOrWhiteSpace(host))
            return null;

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = int.TryParse(Environment.GetEnvironmentVariable("PGPORT"), out var port) ? port : 5432,
            Database = Environment.GetEnvironmentVariable("PGDATABASE")
                ?? Environment.GetEnvironmentVariable("POSTGRES_DB"),
            Username = Environment.GetEnvironmentVariable("PGUSER")
                ?? Environment.GetEnvironmentVariable("POSTGRES_USER"),
            Password = Environment.GetEnvironmentVariable("PGPASSWORD")
                ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD"),
            SslMode = SslMode.Require,
        };

        return builder.ConnectionString;
    }

    private static string Normalize(string value)
    {
        value = value.Trim();

        if (value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
            value = "postgresql://" + value["postgres://".Length..];

        if (!value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return value;

        var uri = new Uri(value);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            SslMode = SslMode.Require,
        };

        if (userInfo.Length == 2)
            builder.Password = Uri.UnescapeDataString(userInfo[1]);

        return builder.ConnectionString;
    }
}
