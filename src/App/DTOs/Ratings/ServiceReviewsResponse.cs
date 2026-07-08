namespace AppointWeb.Api.Dtos.Ratings;

public class ServiceReviewsResponse
{
    public double? AverageRating { get; set; }
    public int RatingCount { get; set; }
    public List<ServiceReviewResponse> Reviews { get; set; } = new();
}
