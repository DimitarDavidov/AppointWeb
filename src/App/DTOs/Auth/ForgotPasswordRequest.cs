using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Auth;

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}
