namespace AppointWeb.Api.Dtos.Catalog;

public class BookingSlotsResponse
{
    public int DurationMinutes { get; set; }

    /// <summary>
    /// Available appointment start times (UTC ISO 8601).
    /// </summary>
    public List<string> Slots { get; set; } = [];
}
