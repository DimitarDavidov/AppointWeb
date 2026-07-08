namespace AppointWeb.Api.Dtos.Admin;

public class AdminUserResponse
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsSuspended { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>Number of active services the user offers (providers only).</summary>
    public int ServiceCount { get; set; }

    /// <summary>
    /// Completed appointments, scoped by role: provider-side for providers,
    /// customer-side otherwise.
    /// </summary>
    public int CompletedCount { get; set; }

    /// <summary>Appointments this user cancelled (CancelledByUserId == user).</summary>
    public int CancelledCount { get; set; }

    /// <summary>
    /// Total revenue from completed appointments where the user is the provider.
    /// Zero for non-providers.
    /// </summary>
    public decimal TotalRevenue { get; set; }
}
