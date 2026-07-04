using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Account;

public class UpdateUsernameRequest
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;
}
