namespace AppointWeb.Api.Dtos.Catalog;

public class BookingSlotsResponse
{
    public int DurationMinutes { get; set; }

    public List<string> Slots { get; set; } = [];
}
