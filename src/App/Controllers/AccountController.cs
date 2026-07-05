using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Account;
using AppointWeb.Api.Dtos.Auth;
using AppointWeb.Api.Dtos.Users;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/account")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;
    private readonly IAccountDeletionService _accountDeletionService;
    private readonly PasswordHasher<User> _hasher = new();

    public AccountController(
        AppDbContext db,
        JwtTokenService jwt,
        IAccountDeletionService accountDeletionService)
    {
        _db = db;
        _jwt = jwt;
        _accountDeletionService = accountDeletionService;
    }

    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> GetProfile(
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var user = await _db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

        return user is null ? NotFound() : Ok(MapProfile(user));
    }

    [HttpPatch("email")]
    public async Task<ActionResult<AuthResponse>> UpdateEmail(
        UpdateEmailRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return NotFound();

        if (string.Equals(user.Email, normalizedEmail, StringComparison.Ordinal))
        {
            return Ok(AuthResponseMapper.MapAuthResponse(user, _jwt.CreateAccessToken(user)));
        }

        if (await _db.Users.AnyAsync(
                u => u.Email == normalizedEmail && u.Id != userId,
                cancellationToken))
        {
            return Conflict("Email already registered.");
        }

        user.Email = normalizedEmail;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(AuthResponseMapper.MapAuthResponse(user, _jwt.CreateAccessToken(user)));
    }

    [HttpPatch("username")]
    public async Task<ActionResult<AuthResponse>> UpdateUsername(
        UpdateUsernameRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var normalizedUsername = request.Username.Trim().ToLowerInvariant();

        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return NotFound();

        if (string.Equals(user.Username, normalizedUsername, StringComparison.Ordinal))
        {
            return Ok(AuthResponseMapper.MapAuthResponse(user, _jwt.CreateAccessToken(user)));
        }

        if (await _db.Users.AnyAsync(
                u => u.Username == normalizedUsername && u.Id != userId,
                cancellationToken))
        {
            return Conflict("Username already taken.");
        }

        user.Username = normalizedUsername;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(AuthResponseMapper.MapAuthResponse(user, _jwt.CreateAccessToken(user)));
    }

    [HttpPatch("password")]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return NotFound();

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (result == PasswordVerificationResult.Failed)
            return BadRequest("Current password is incorrect.");

        user.PasswordHash = _hasher.HashPassword(user, request.NewPassword);
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Password updated successfully." });
    }

    [HttpPatch("phone-number")]
    public async Task<ActionResult<UserProfileResponse>> UpdatePhoneNumber(
        UpdatePhoneNumberRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            return NotFound();

        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber)
            ? null
            : request.PhoneNumber.Trim();

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(MapProfile(user));
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteAccount(
        DeleteAccountRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        try
        {
            await _accountDeletionService.DeleteAccountAsync(
                userId,
                request.Password,
                cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return BadRequest("Password is incorrect.");
        }

        return NoContent();
    }

    private static UserProfileResponse MapProfile(User user) =>
        new()
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
        };
}
