using System.ComponentModel.DataAnnotations;

namespace AppointWeb.Api.Dtos.Provider;

public class ProviderAvailabilitySlotRequest
{
    [Range(0, 6)]
    public int DayOfWeek { get; set; }

    [Required]
    public string StartTime { get; set; } = string.Empty;

    [Required]
    public string EndTime { get; set; } = string.Empty;
}

public class UpdateProviderAvailabilityRequest
{
    public List<ProviderAvailabilitySlotRequest> Slots { get; set; } = [];
}
