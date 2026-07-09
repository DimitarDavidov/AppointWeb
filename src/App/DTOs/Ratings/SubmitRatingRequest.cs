using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Ratings;

public class SubmitRatingRequest
{

    public decimal? Stars { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; }
}
