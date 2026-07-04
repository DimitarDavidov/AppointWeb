using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Account;

public class UpdateEmailRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}
