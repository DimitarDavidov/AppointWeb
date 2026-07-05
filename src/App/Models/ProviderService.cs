namespace AppointWeb.Api.Models;

public class ProviderService
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProviderId { get; set; }

    public Guid ServiceId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Provider { get; set; } = null!;

    public Service Service { get; set; } = null!;
}
