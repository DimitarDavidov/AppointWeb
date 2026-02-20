namespace AppointWeb.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;

    public ICollection<Appointment> CustomerAppointments { get; set; } = new List<Appointment>();
    public ICollection<Appointment> ProviderAppointments { get; set; } = new List<Appointment>();
}