using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Appointments;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Claims;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppointmentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AppointmentDetailResponse>>> GetMine(
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointments = await FilterAppointmentsForUser(userId, role)
            .OrderByDescending(a => a.StartTime)
            .Select(a => new AppointmentDetailResponse
            {
                Id = a.Id,
                CustomerId = a.CustomerId,
                CustomerUsername = a.Customer.Username,
                ProviderId = a.ProviderId,
                ProviderUsername = a.Provider.Username,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.Name,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                Status = a.Status == AppointmentStatus.Booked ? "Booked"
                    : a.Status == AppointmentStatus.Cancelled ? "Cancelled"
                    : a.Status == AppointmentStatus.Completed ? "Completed"
                    : "NoShow",
                PriceAtBooking = a.PriceAtBooking,
            })
            .ToListAsync(ct);

        return Ok(appointments);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppointmentDetailResponse>> GetById(Guid id, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointment = await FilterAppointmentsForUser(userId, role)
            .Where(a => a.Id == id)
            .Select(a => new AppointmentDetailResponse
            {
                Id = a.Id,
                CustomerId = a.CustomerId,
                CustomerUsername = a.Customer.Username,
                ProviderId = a.ProviderId,
                ProviderUsername = a.Provider.Username,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.Name,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                Status = a.Status == AppointmentStatus.Booked ? "Booked"
                    : a.Status == AppointmentStatus.Cancelled ? "Cancelled"
                    : a.Status == AppointmentStatus.Completed ? "Completed"
                    : "NoShow",
                PriceAtBooking = a.PriceAtBooking,
            })
            .SingleOrDefaultAsync(ct);

        return appointment is null ? NotFound() : Ok(appointment);
    }

    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> Create(
        CreateAppointmentRequest request,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var customerId))
            return Unauthorized("Invalid token: missing user id.");

        if (customerId == request.ProviderId)
            return BadRequest("You cannot book an appointment with yourself.");

        var startUtc = request.StartTime.Kind == DateTimeKind.Utc
            ? request.StartTime
            : request.StartTime.ToUniversalTime();

        if (startUtc < DateTime.UtcNow.AddMinutes(-1))
            return BadRequest("Invalid start time.");

        var service = await _db.Services
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, ct);

        if (service is null)
            return NotFound("Service not found.");

        var provider = await _db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(u => u.Id == request.ProviderId, ct);

        if (provider is null)
            return NotFound("Provider not found.");

        if (provider.Role != UserRoles.Provider)
            return BadRequest("The selected user is not a provider.");

        var offersService = await _db.ProviderServices.AsNoTracking().AnyAsync(ps =>
            ps.ProviderId == request.ProviderId &&
            ps.ServiceId == request.ServiceId &&
            ps.IsActive, ct);

        if (!offersService)
            return BadRequest("This provider does not offer the selected service.");

        var endUtc = startUtc.AddMinutes(service.DurationMinutes);

        if (!await FitsProviderAvailabilityAsync(request.ProviderId, startUtc, endUtc, ct))
        {
            return BadRequest("The selected time is outside the provider's availability.");
        }

        var overlaps = await _db.Appointments.AsNoTracking().AnyAsync(a =>
            a.ProviderId == request.ProviderId &&
            a.Status == AppointmentStatus.Booked &&
            a.StartTime < endUtc &&
            a.EndTime > startUtc, ct);

        if (overlaps)
            return Conflict("This time slot is already booked.");

        var appointment = new Appointment
        {
            CustomerId = customerId,
            ProviderId = request.ProviderId,
            ServiceId = request.ServiceId,
            StartTime = startUtc,
            EndTime = endUtc,
            Status = AppointmentStatus.Booked,
            PriceAtBooking = service.Price
        };

        _db.Appointments.Add(appointment);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23P01")
        {
            return Conflict("This time slot is already booked.");
        }

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    [HttpPatch("{id:guid}/cancel")]
    public async Task<ActionResult<AppointmentResponse>> Cancel(Guid id, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointment = await _db.Appointments
            .SingleOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (!CanAccessAppointment(appointment, userId, role))
            return Forbid();

        if (appointment.Status != AppointmentStatus.Booked)
            return BadRequest("Only booked appointments can be cancelled.");

        appointment.Status = AppointmentStatus.Cancelled;
        await _db.SaveChangesAsync(ct);

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    [HttpPatch("{id:guid}/reschedule")]
    public async Task<ActionResult<AppointmentResponse>> Reschedule(
        Guid id,
        RescheduleAppointmentRequest request,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var role = User.FindFirstValue(ClaimTypes.Role);

        var appointment = await _db.Appointments
            .Include(a => a.Service)
            .SingleOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
            return NotFound();

        if (!CanAccessAppointment(appointment, userId, role))
            return Forbid();

        if (appointment.Status != AppointmentStatus.Booked)
            return BadRequest("Only booked appointments can be rescheduled.");

        var startUtc = request.StartTime.Kind == DateTimeKind.Utc
            ? request.StartTime
            : request.StartTime.ToUniversalTime();

        if (startUtc < DateTime.UtcNow.AddMinutes(-1))
            return BadRequest("Invalid start time.");

        if (!appointment.Service.IsActive)
            return BadRequest("This service is no longer available.");

        var endUtc = startUtc.AddMinutes(appointment.Service.DurationMinutes);

        if (!await FitsProviderAvailabilityAsync(appointment.ProviderId, startUtc, endUtc, ct))
            return BadRequest("The selected time is outside the provider's availability.");

        var overlaps = await _db.Appointments.AsNoTracking().AnyAsync(a =>
            a.Id != id &&
            a.ProviderId == appointment.ProviderId &&
            a.Status == AppointmentStatus.Booked &&
            a.StartTime < endUtc &&
            a.EndTime > startUtc, ct);

        if (overlaps)
            return Conflict("This time slot is already booked.");

        appointment.StartTime = startUtc;
        appointment.EndTime = endUtc;

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23P01")
        {
            return Conflict("This time slot is already booked.");
        }

        return Ok(AppointmentMapper.MapResponse(appointment));
    }

    private IQueryable<Appointment> FilterAppointmentsForUser(Guid userId, string? role)
    {
        var query = _db.Appointments.AsNoTracking();

        if (role == UserRoles.Admin)
            return query;

        if (role == UserRoles.Provider)
            return query.Where(a => a.ProviderId == userId);

        return query.Where(a => a.CustomerId == userId);
    }

    private static bool CanAccessAppointment(Appointment appointment, Guid userId, string? role)
    {
        if (role == UserRoles.Admin)
            return true;

        return appointment.CustomerId == userId || appointment.ProviderId == userId;
    }

    private async Task<bool> FitsProviderAvailabilityAsync(
        Guid providerId,
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken ct)
    {
        var hasAvailabilityRules = await _db.ProviderAvailabilities
            .AsNoTracking()
            .AnyAsync(a => a.ProviderId == providerId, ct);

        if (!hasAvailabilityRules)
            return true;

        var startTime = TimeOnly.FromDateTime(startUtc);
        var endTime = TimeOnly.FromDateTime(endUtc);

        if (endTime <= startTime)
            return false;

        var dayOfWeek = (int)startUtc.DayOfWeek;

        return await _db.ProviderAvailabilities.AsNoTracking().AnyAsync(a =>
            a.ProviderId == providerId &&
            a.DayOfWeek == dayOfWeek &&
            a.StartTime <= startTime &&
            a.EndTime >= endTime, ct);
    }
}
