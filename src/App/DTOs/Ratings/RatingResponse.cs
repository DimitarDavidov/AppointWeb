namespace AppointWeb.Api.Dtos.Ratings;

public class RatingResponse
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public string Direction { get; set; } = string.Empty;
    public decimal? Stars { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
