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
        var users = await ProjectUsers(_db.Users.AsNoTracking().OrderBy(u => u.Username))
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpGet("users/{id:guid}/services")]
    public async Task<ActionResult<IEnumerable<AdminServiceStatsResponse>>> GetUserServices(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == id, cancellationToken))
            return NotFound();

        var services = await _db.ProviderServices
            .AsNoTracking()
            .Where(ps => ps.ProviderId == id)
            .OrderByDescending(ps => ps.IsActive && ps.Service.IsActive)
            .ThenBy(ps => ps.Service.Name)
            .Select(ps => new AdminServiceStatsResponse
            {
                ServiceId = ps.ServiceId,
                ServiceName = ps.Service.Name,
                Category = ps.Service.Category,
                Price = ps.Service.Price,
                IsActive = ps.IsActive && ps.Service.IsActive,
                TotalAppointments = _db.Appointments.Count(a =>
                    a.ServiceId == ps.ServiceId && a.ProviderId == id),
                CompletedCount = _db.Appointments.Count(a =>
                    a.ServiceId == ps.ServiceId &&
                    a.ProviderId == id &&
                    a.Status == AppointmentStatus.Completed),
                CancelledCount = _db.Appointments.Count(a =>
                    a.ServiceId == ps.ServiceId &&
                    a.ProviderId == id &&
                    a.Status == AppointmentStatus.Cancelled),
                Revenue = _db.Appointments
                    .Where(a =>
                        a.ServiceId == ps.ServiceId &&
                        a.ProviderId == id &&
                        a.Status == AppointmentStatus.Completed)
                    .Sum(a => (decimal?)a.PriceAtBooking) ?? 0m,
            })
            .ToListAsync(cancellationToken);

        return Ok(services);
    }

    [HttpGet("users/{id:guid}/cancelled-appointments")]
    public async Task<ActionResult<IEnumerable<AdminCancelledAppointmentResponse>>> GetUserCancelledAppointments(
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == id, cancellationToken))
            return NotFound();

        var appointments = await ProjectCancelledAppointments(
                _db.Appointments.Where(a =>
                    a.CancelledByUserId == id &&
                    a.Status == AppointmentStatus.Cancelled))
            .ToListAsync(cancellationToken);

        return Ok(appointments);
    }

    [HttpGet("users/{id:guid}/services/{serviceId:guid}/cancelled-appointments")]
    public async Task<ActionResult<IEnumerable<AdminCancelledAppointmentResponse>>> GetServiceCancelledAppointments(
        Guid id,
        Guid serviceId,
        CancellationToken cancellationToken)
    {
        if (!await _db.Users.AnyAsync(u => u.Id == id, cancellationToken))
            return NotFound();

        var appointments = await ProjectCancelledAppointments(
                _db.Appointments.Where(a =>
                    a.ProviderId == id &&
                    a.ServiceId == serviceId &&
                    a.Status == AppointmentStatus.Cancelled))
            .ToListAsync(cancellationToken);

        return Ok(appointments);
    }

    private static IQueryable<AdminCancelledAppointmentResponse> ProjectCancelledAppointments(
        IQueryable<Appointment> query) =>
        query
            .AsNoTracking()
            .OrderByDescending(a => a.StartTime)
            .Select(a => new AdminCancelledAppointmentResponse
            {
                Id = a.Id,
                ServiceName = a.Service.Name,
                CustomerUsername = a.Customer.Username,
                ProviderUsername = a.Provider.Username,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                PriceAtBooking = a.PriceAtBooking,
                CancellationReason = a.CancellationReason,
                CreatedAt = a.CreatedAt,
            });

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

        return Ok(await BuildUserResponseAsync(id, cancellationToken));
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

        return Ok(await BuildUserResponseAsync(id, cancellationToken));
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

        return Ok(await BuildUserResponseAsync(id, cancellationToken));
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

    private Task<AdminUserResponse> BuildUserResponseAsync(
        Guid id,
        CancellationToken cancellationToken) =>
        ProjectUsers(_db.Users.AsNoTracking().Where(u => u.Id == id))
            .FirstAsync(cancellationToken);

    private IQueryable<AdminUserResponse> ProjectUsers(IQueryable<User> users) =>
        users.Select(u => new AdminUserResponse
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber,
            Role = u.Role,
            IsSuspended = u.IsSuspended,
            CreatedAt = u.CreatedAt,
            ServiceCount = u.ProviderServices.Count(ps => ps.IsActive && ps.Service.IsActive),
            CompletedCount = u.Role == UserRoles.Provider
                ? u.ProviderAppointments.Count(a => a.Status == AppointmentStatus.Completed)
                : u.CustomerAppointments.Count(a => a.Status == AppointmentStatus.Completed),
            CancelledCount = _db.Appointments.Count(a => a.CancelledByUserId == u.Id),
            TotalRevenue = u.ProviderAppointments
                .Where(a => a.Status == AppointmentStatus.Completed)
                .Sum(a => (decimal?)a.PriceAtBooking) ?? 0m,
        });
}
