using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Provider;

public class UpdateProviderServiceRequest
{
    [Required]
    [MinLength(2)]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [Required]
    [MinLength(1)]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [Range(1, 1440)]
    public int DurationMinutes { get; set; }

    [Range(0, 100000)]
    public decimal Price { get; set; }
}
