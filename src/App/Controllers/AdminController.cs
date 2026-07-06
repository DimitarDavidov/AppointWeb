using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Admin;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = UserRoles.Admin)]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAccountDeletionService _accountDeletionService;

    public AdminController(AppDbContext db, IAccountDeletionService accountDeletionService)
    {
        _db = db;
        _accountDeletionService = accountDeletionService;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserResponse>>> GetUsers(
        CancellationToken cancellationToken)
    {
        var users = await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Username)
            .Select(u => new AdminUserResponse
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                IsSuspended = u.IsSuspended,
                CreatedAt = u.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpPatch("users/{id:guid}")]
    public async Task<ActionResult<AdminUserResponse>> UpdateUser(
        Guid id,
        UpdateAdminUserRequest request,
        CancellationToken cancellationToken)
    {
        if (!UserRoles.IsValid(request.Role))
            return BadRequest("Invalid role.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedUsername = request.Username.Trim().ToLowerInvariant();

        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
            return NotFound();

        if (!string.Equals(user.Email, normalizedEmail, StringComparison.Ordinal) &&
            await _db.Users.AnyAsync(
                u => u.Email == normalizedEmail && u.Id != id,
                cancellationToken))
        {
            return Conflict("Email already registered.");
        }

        if (!string.Equals(user.Username, normalizedUsername, StringComparison.Ordinal) &&
            await _db.Users.AnyAsync(
                u => u.Username == normalizedUsername && u.Id != id,
                cancellationToken))
        {
            return Conflict("Username already taken.");
        }

        user.Email = normalizedEmail;
        user.Username = normalizedUsername;
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber)
            ? null
            : request.PhoneNumber.Trim();
        user.Role = request.Role;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(MapUser(user));
    }

    [HttpPatch("users/{id:guid}/suspend")]
    public async Task<ActionResult<AdminUserResponse>> SuspendUser(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (User.TryGetUserId(out var adminId) && adminId == id)
            return BadRequest("You cannot suspend your own account.");

        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
            return NotFound();

        if (user.IsSuspended)
            return BadRequest("User is already suspended.");

        user.IsSuspended = true;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(MapUser(user));
    }

    [HttpPatch("users/{id:guid}/unsuspend")]
    public async Task<ActionResult<AdminUserResponse>> UnsuspendUser(
        Guid id,
        CancellationToken cancellationToken)
    {
        var user = await _db.Users.SingleOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
            return NotFound();

        if (!user.IsSuspended)
            return BadRequest("User is not suspended.");

        user.IsSuspended = false;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(MapUser(user));
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        if (User.TryGetUserId(out var adminId) && adminId == id)
            return BadRequest("You cannot delete your own account.");

        try
        {
            await _accountDeletionService.DeleteUserByAdminAsync(id, cancellationToken);
        }
        catch (InvalidOperationException)
        {
            return NotFound();
        }

        return NoContent();
    }

    private static AdminUserResponse MapUser(User user) =>
        new()
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            IsSuspended = user.IsSuspended,
            CreatedAt = user.CreatedAt,
        };
}
