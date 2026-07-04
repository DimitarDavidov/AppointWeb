namespace AppointWeb.Api.Services.Interfaces;

public interface IPasswordResetService
{
    Task RequestResetAsync(string email, CancellationToken cancellationToken = default);
}
