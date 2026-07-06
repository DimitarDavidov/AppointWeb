using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Admin;

public class UpdateAdminUserRequest
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    [Required]
    public string Role { get; set; } = string.Empty;
}
