namespace AppointWeb.Api.Models;

public static class UserRoles
{
    public const string Customer = "Customer";
    public const string Provider = "Provider";
    public const string Admin = "Admin";

    public static readonly IReadOnlySet<string> All =
        new HashSet<string>(StringComparer.Ordinal) { Customer, Provider, Admin };

    public static readonly IReadOnlySet<string> SelfRegistration =
        new HashSet<string>(StringComparer.Ordinal) { Customer, Provider };

    public static bool IsValid(string role) => All.Contains(role);

    public static string ResolveRegistrationRole(string? requestedRole)
    {
        if (string.IsNullOrWhiteSpace(requestedRole))
            return Customer;

        var normalized = requestedRole.Trim();

        return SelfRegistration.Contains(normalized) ? normalized : Customer;
    }
}
