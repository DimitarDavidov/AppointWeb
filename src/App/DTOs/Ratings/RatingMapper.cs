using AppointWeb.Api.Models;

namespace AppointWeb.Api.Dtos.Ratings;

public static class RatingMapper
{
    public static string ToApiDirection(RatingDirection direction) =>
        direction switch
        {
            RatingDirection.CustomerToProvider => "CustomerToProvider",
            RatingDirection.ProviderToCustomer => "ProviderToCustomer",
            _ => direction.ToString(),
        };

    public static RatingResponse MapResponse(Rating rating) =>
        new()
        {
            Id = rating.Id,
            AppointmentId = rating.AppointmentId,
            Direction = ToApiDirection(rating.Direction),
            Stars = rating.Stars,
            Comment = rating.Comment,
            CreatedAt = rating.CreatedAt,
            UpdatedAt = rating.UpdatedAt,
        };

    public static bool IsValidStars(decimal stars) =>
        stars >= 0.5m && stars <= 5.0m && (stars * 2m) % 1m == 0m;
}
