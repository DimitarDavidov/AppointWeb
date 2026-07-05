using AppointWeb.Api.Services.Interfaces;

namespace AppointWeb.Api.Services;

public interface IAccountDeletionService
{
    Task DeleteAccountAsync(Guid userId, string password, CancellationToken cancellationToken = default);
}
