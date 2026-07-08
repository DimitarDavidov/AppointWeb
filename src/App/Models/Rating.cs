using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Models;

public class Rating
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid AppointmentId { get; set; }

    [Required]
    public Guid ServiceId { get; set; }

    /// <summary>User who left the rating.</summary>
    [Required]
    public Guid RaterId { get; set; }

    /// <summary>User being rated (the other party in the appointment).</summary>
    [Required]
    public Guid RateeId { get; set; }

    [Required]
    public RatingDirection Direction { get; set; }

    /// <summary>
    /// Star rating from 0.5 to 5.0 in 0.5 increments. Null when the user chose
    /// to leave only a comment; null stars are excluded from public averages.
    /// </summary>
    public decimal? Stars { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Appointment Appointment { get; set; } = null!;
    public Service Service { get; set; } = null!;
    public User Rater { get; set; } = null!;
    public User Ratee { get; set; } = null!;
}
