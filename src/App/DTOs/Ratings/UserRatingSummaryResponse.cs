namespace AppointWeb.Api.Dtos.Ratings;

public class UserRatingSummaryResponse
{
    public RatingAggregateResponse AsCustomer { get; set; } = new();
    public RatingAggregateResponse AsProvider { get; set; } = new();
}
