using System.Security.Cryptography;
using System.Text;
using AppointWeb.Api.Data;
using AppointWeb.Api.Models;
using AppointWeb.Api.Options;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace AppointWeb.Api.Services;

public class PasswordResetService : IPasswordResetService
{
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(1);

    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly FrontendSettings _frontendSettings;
    private readonly ILogger<PasswordResetService> _logger;
    private readonly PasswordHasher<User> _hasher = new();

    public PasswordResetService(
        AppDbContext db,
        IEmailService emailService,
        IOptions<FrontendSettings> frontendSettings,
        ILogger<PasswordResetService> logger)
    {
        _db = db;
        _emailService = emailService;
        _frontendSettings = frontendSettings.Value;
        _logger = logger;
    }

    public async Task RequestResetAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        if (user is null)
            return;

        var existingTokens = await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null)
            .ToListAsync(cancellationToken);

        if (existingTokens.Count > 0)
            _db.PasswordResetTokens.RemoveRange(existingTokens);

        var rawToken = GenerateSecureToken();
        var tokenEntity = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.Add(TokenLifetime)
        };

        _db.PasswordResetTokens.Add(tokenEntity);
        await _db.SaveChangesAsync(cancellationToken);

        var resetLink =
            $"{_frontendSettings.BaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(rawToken)}";

        try
        {
            await _emailService.SendPasswordResetEmailAsync(
                user.Email,
                resetLink,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send password reset email to {Email}",
                user.Email);

            _db.PasswordResetTokens.Remove(tokenEntity);
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<bool> ResetPasswordAsync(
        string token,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return false;

        var tokenHash = HashToken(token);
        var resetToken = await _db.PasswordResetTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(
                t => t.TokenHash == tokenHash && t.UsedAt == null,
                cancellationToken);

        if (resetToken is null || resetToken.ExpiresAt <= DateTime.UtcNow)
            return false;

        resetToken.User.PasswordHash = _hasher.HashPassword(resetToken.User, newPassword);
        resetToken.UsedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string GenerateSecureToken()
    {
        var bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string HashToken(string rawToken)
    {
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(hashBytes);
    }
}
