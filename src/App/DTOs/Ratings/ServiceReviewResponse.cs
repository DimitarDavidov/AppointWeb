namespace AppointWeb.Api.Dtos.Ratings;

public class ServiceReviewResponse
{
    public decimal? Stars { get; set; }
    public string? Comment { get; set; }
    public Guid ReviewerId { get; set; }
    public string ReviewerUsername { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
