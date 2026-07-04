using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Auth;

public class RegisterRequest
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Optional. Allowed values: Customer (default), Provider.
    /// Admin cannot be assigned via registration.
    /// </summary>
    public string? Role { get; set; }
}