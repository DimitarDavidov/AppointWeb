using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = UserRoles.Customer;

    public string? PhoneNumber { get; set; }

    /// <summary>
    /// IANA timezone id (e.g. "Europe/Sofia") the user's wall-clock times are
    /// expressed in. Provider availability windows are interpreted in this zone.
    /// </summary>
    public string TimeZoneId { get; set; } = "UTC";

    public bool IsSuspended { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Appointment> CustomerAppointments { get; set; } = new List<Appointment>();
    public ICollection<Appointment> ProviderAppointments { get; set; } = new List<Appointment>();
    public ICollection<ProviderAvailability> ProviderAvailabilities { get; set; } =
        new List<ProviderAvailability>();
    public ICollection<ProviderService> ProviderServices { get; set; } =
        new List<ProviderService>();
    public ICollection<Notification> Notifications { get; set; } =
        new List<Notification>();
}