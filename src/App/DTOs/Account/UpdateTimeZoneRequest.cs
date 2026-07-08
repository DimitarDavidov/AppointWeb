using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Account;

public class UpdateTimeZoneRequest
{
    [Required, MaxLength(100)]
    public string TimeZoneId { get; set; } = string.Empty;
}
