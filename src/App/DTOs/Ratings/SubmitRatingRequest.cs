using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Ratings;

public class SubmitRatingRequest
{
    /// <summary>
    /// Optional star value (0.5–5.0 in 0.5 steps). Null means "comment only".
    /// </summary>
    public decimal? Stars { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}
