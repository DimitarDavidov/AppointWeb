namespace AppointWeb.Api.Dtos.Admin;


public class AdminServiceStatsResponse
{
    public Guid ServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }

    public int TotalAppointments { get; set; }
    public int CompletedCount { get; set; }
    public int CancelledCount { get; set; }

    public decimal Revenue { get; set; }
}
