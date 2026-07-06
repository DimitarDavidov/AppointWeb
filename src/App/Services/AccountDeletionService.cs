using AppointWeb.Api.Data;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Services;

public class AccountDeletionService : IAccountDeletionService
{
    private readonly AppDbContext _db;
    private readonly PasswordHasher<User> _hasher = new();

    public AccountDeletionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task DeleteAccountAsync(
        Guid userId,
        string password,
        CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        var verification = _hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verification == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Password is incorrect.");

        await DeleteUserDataAsync(userId, cancellationToken);
    }

    public async Task DeleteUserByAdminAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var exists = await _db.Users.AnyAsync(u => u.Id == userId, cancellationToken);
        if (!exists)
            throw new InvalidOperationException("User not found.");

        await DeleteUserDataAsync(userId, cancellationToken);
    }

    private async Task DeleteUserDataAsync(Guid userId, CancellationToken cancellationToken)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            await _db.Appointments
                .Where(a => a.CustomerId == userId || a.ProviderId == userId)
                .ExecuteDeleteAsync(cancellationToken);

            await _db.ProviderServices
                .Where(ps => ps.ProviderId == userId)
                .ExecuteDeleteAsync(cancellationToken);

            await _db.ProviderAvailabilities
                .Where(a => a.ProviderId == userId)
                .ExecuteDeleteAsync(cancellationToken);

            var user = await _db.Users.SingleAsync(u => u.Id == userId, cancellationToken);
            _db.Users.Remove(user);
            await _db.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
