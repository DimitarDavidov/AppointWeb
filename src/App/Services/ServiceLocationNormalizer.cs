using AppointWeb.Api.Dtos.Provider;

namespace AppointWeb.Api.Services;

public static class ServiceLocationNormalizer
{
    public static (string City, string Country, string? Error) Normalize(
        UpdateProviderServiceRequest request)
    {
        if (request.IsRemote)
            return (string.Empty, string.Empty, null);

        var country = request.Country.Trim();
        var city = request.City.Trim();

        if (string.IsNullOrEmpty(country))
            return (string.Empty, string.Empty, "Country is required for in-person services.");

        if (string.IsNullOrEmpty(city))
            return (string.Empty, string.Empty, "City is required for in-person services.");

        return (city, country, null);
    }
}
