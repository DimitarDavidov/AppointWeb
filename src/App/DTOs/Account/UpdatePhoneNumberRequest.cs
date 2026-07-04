using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Account;

public class UpdatePhoneNumberRequest
{
    [MaxLength(50)]
    public string? PhoneNumber { get; set; }
}
