using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Appointments;
using AppointWeb.Api.Dtos.Provider;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/provider")]
[Authorize(Roles = $"{UserRoles.Provider},{UserRoles.Admin}")]
public class ProviderController : ControllerBase
{
    private readonly AppDbContext _db;

    public ProviderController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("appointments")]
    public async Task<ActionResult<IEnumerable<AppointmentDetailResponse>>> GetAppointments(
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        var appointments = await _db.Appointments
            .AsNoTracking()
            .Where(a => a.ProviderId == providerId)
            .OrderBy(a => a.StartTime)
            .Select(a => new AppointmentDetailResponse
            {
                Id = a.Id,
                CustomerId = a.CustomerId,
                CustomerUsername = a.Customer.Username,
                CustomerPhoneNumber = a.Customer.PhoneNumber,
                ProviderId = a.ProviderId,
                ProviderUsername = a.Provider.Username,
                ServiceId = a.ServiceId,
                ServiceName = a.Service.Name,
                StartTime = a.StartTime,
                EndTime = a.EndTime,
                CreatedAt = a.CreatedAt,
                Status = AppointmentStatusMapper.ToApiStatus(a.Status),
                PriceAtBooking = a.PriceAtBooking,
                CancellationReason = a.CancellationReason,
                CancelledByUserId = a.CancelledByUserId,
                PendingRescheduleStartTime = a.PendingRescheduleStartTime,
                PendingRescheduleEndTime = a.PendingRescheduleEndTime,
                RescheduleReason = a.RescheduleReason,
                RescheduleRequestedByUserId = a.RescheduleRequestedByUserId,
                ProviderRescheduleCount = a.ProviderRescheduleCount,
                CustomerRescheduleCount = a.CustomerRescheduleCount,
                PreviousStartTime = a.PreviousStartTime,
            })
            .ToListAsync(cancellationToken);

        return Ok(appointments);
    }

    [HttpGet("services")]
    public async Task<ActionResult<IEnumerable<ProviderServiceResponse>>> GetServices(
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        var services = await _db.ProviderServices
            .AsNoTracking()
            .Where(ps =>
                ps.ProviderId == providerId &&
                ps.IsActive &&
                ps.Service.IsActive)
            .OrderBy(ps => ps.Service.Name)
            .Select(ps => new ProviderServiceResponse
            {
                ServiceId = ps.ServiceId,
                ServiceName = ps.Service.Name,
                Description = ps.Service.Description,
                Category = ps.Service.Category,
                Country = ps.Service.Country,
                City = ps.Service.City,
                DurationMinutes = ps.Service.DurationMinutes,
                Price = ps.Service.Price,
            })
            .ToListAsync(cancellationToken);

        return Ok(services);
    }

    [HttpPatch("services/{serviceId:guid}")]
    public async Task<ActionResult<ProviderServiceResponse>> UpdateService(
        Guid serviceId,
        UpdateProviderServiceRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        var link = await _db.ProviderServices
            .Include(ps => ps.Service)
            .SingleOrDefaultAsync(
                ps => ps.ProviderId == providerId && ps.ServiceId == serviceId,
                cancellationToken);

        if (link is null || !link.IsActive || !link.Service.IsActive)
            return NotFound("Service not found.");

        var service = link.Service;
        service.Name = request.Name.Trim();
        service.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        service.Category = string.IsNullOrWhiteSpace(request.Category)
            ? null
            : request.Category.Trim();
        service.Country = request.Country.Trim();
        service.City = request.City.Trim();
        service.DurationMinutes = request.DurationMinutes;
        service.Price = request.Price;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new ProviderServiceResponse
        {
            ServiceId = service.Id,
            ServiceName = service.Name,
            Description = service.Description,
            Category = service.Category,
            Country = service.Country,
            City = service.City,
            DurationMinutes = service.DurationMinutes,
            Price = service.Price,
        });
    }

    [HttpGet("availability")]
    public async Task<ActionResult<IEnumerable<ProviderAvailabilityResponse>>> GetAvailability(
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        var slots = await _db.ProviderAvailabilities
            .AsNoTracking()
            .Where(a => a.ProviderId == providerId)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .Select(a => new ProviderAvailabilityResponse
            {
                Id = a.Id,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime.ToString("HH\\:mm"),
                EndTime = a.EndTime.ToString("HH\\:mm"),
            })
            .ToListAsync(cancellationToken);

        return Ok(slots);
    }

    [HttpPut("availability")]
    public async Task<ActionResult<IEnumerable<ProviderAvailabilityResponse>>> UpdateAvailability(
        UpdateProviderAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        var parsedSlots = new List<(int DayOfWeek, TimeOnly Start, TimeOnly End)>();

        foreach (var slot in request.Slots)
        {
            if (!TimeOnly.TryParse(slot.StartTime, out var startTime))
                return BadRequest($"Invalid start time: {slot.StartTime}");

            if (!TimeOnly.TryParse(slot.EndTime, out var endTime))
                return BadRequest($"Invalid end time: {slot.EndTime}");

            if (endTime <= startTime)
                return BadRequest("End time must be after start time.");

            parsedSlots.Add((slot.DayOfWeek, startTime, endTime));
        }

        var existing = await _db.ProviderAvailabilities
            .Where(a => a.ProviderId == providerId)
            .ToListAsync(cancellationToken);

        _db.ProviderAvailabilities.RemoveRange(existing);

        foreach (var slot in parsedSlots)
        {
            _db.ProviderAvailabilities.Add(new ProviderAvailability
            {
                ProviderId = providerId,
                DayOfWeek = slot.DayOfWeek,
                StartTime = slot.Start,
                EndTime = slot.End,
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        var updated = await _db.ProviderAvailabilities
            .AsNoTracking()
            .Where(a => a.ProviderId == providerId)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .Select(a => new ProviderAvailabilityResponse
            {
                Id = a.Id,
                DayOfWeek = a.DayOfWeek,
                StartTime = a.StartTime.ToString("HH\\:mm"),
                EndTime = a.EndTime.ToString("HH\\:mm"),
            })
            .ToListAsync(cancellationToken);

        return Ok(updated);
    }
}
