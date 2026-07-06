namespace AppointWeb.Api.Services.Interfaces;

public interface IAccountDeletionService
{
    Task DeleteAccountAsync(Guid userId, string password, CancellationToken cancellationToken = default);

    Task DeleteUserByAdminAsync(Guid userId, CancellationToken cancellationToken = default);
}
