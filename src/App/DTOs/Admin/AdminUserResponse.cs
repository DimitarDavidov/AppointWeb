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

    public int ServiceCount { get; set; }


    public int CompletedCount { get; set; }

    public int CancelledCount { get; set; }

   
    public decimal TotalRevenue { get; set; }
}
