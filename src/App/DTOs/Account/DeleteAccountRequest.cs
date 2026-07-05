using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Account;

public class DeleteAccountRequest
{
    [Required]
    public string Password { get; set; } = string.Empty;
}
