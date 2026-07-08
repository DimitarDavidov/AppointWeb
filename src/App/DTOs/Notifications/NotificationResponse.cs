namespace AppointWeb.Api.Dtos.Notifications;

public class NotificationResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? AppointmentId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
