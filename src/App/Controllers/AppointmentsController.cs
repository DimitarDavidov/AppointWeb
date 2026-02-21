using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Appointments;
using AppointWeb.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Security.Claims;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AppointmentsController(AppDbContext db)
    {
        _db = db;
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> Create(CreateAppointmentRequest request, CancellationToken ct)
    {
        // Get customer id from JWT
        var customerIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(customerIdStr, out var customerId))
            return Unauthorized("Invalid token: missing user id.");

        var startUtc = request.StartTime.Kind == DateTimeKind.Utc
            ? request.StartTime
            : request.StartTime.ToUniversalTime();

        if (startUtc < DateTime.UtcNow.AddMinutes(-1))
            return BadRequest("Invilit start time");

        var service = await _db.Services
            .AsNoTracking()
            .SingleOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, ct);

        if (service is null)
            return NotFound("Service not found.");

        var providerExists = await _db.Users
            .AsNoTracking()
            .AnyAsync(u => u.Id == request.ProviderId, ct);

        if (!providerExists)
            return NotFound("Provider not found.");

        var endUtc = startUtc.AddMinutes(service.DurationMinutes);

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

        return Ok(new AppointmentResponse
        {
            Id = appointment.Id,
            CustomerId = appointment.CustomerId,
            ProviderId = appointment.ProviderId,
            ServiceId = appointment.ServiceId,
            StartTime = appointment.StartTime,
            EndTime = appointment.EndTime,
            Status = appointment.Status.ToString(),
            PriceAtBooking = appointment.PriceAtBooking
        });
    }
}