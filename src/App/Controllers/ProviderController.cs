using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Appointments;
using AppointWeb.Api.Dtos.Provider;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services;
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

        var appointments = await AppointmentMapper.ProjectToDetail(
                _db.Appointments
                    .AsNoTracking()
                    .Where(a => a.ProviderId == providerId))
            .OrderBy(a => a.StartTime)
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
                IsRemote = ps.Service.IsRemote,
                DurationMinutes = ps.Service.DurationMinutes,
                Price = ps.Service.Price,
            })
            .ToListAsync(cancellationToken);

        return Ok(services);
    }

    [HttpPost("services")]
    public async Task<ActionResult<ProviderServiceResponse>> CreateService(
        UpdateProviderServiceRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        if (!ServiceCategories.IsValid(request.Category))
        {
            return BadRequest(
                $"Category must be one of: {string.Join(", ", ServiceCategories.All)}.");
        }

        var normalizedCategory = request.Category.Trim();
        var (city, country, locationError) = ServiceLocationNormalizer.Normalize(request);

        if (locationError is not null)
            return BadRequest(locationError);

        var service = new Service
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim(),
            Category = normalizedCategory,
            Country = country,
            City = city,
            IsRemote = request.IsRemote,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
        };

        var link = new ProviderService
        {
            ProviderId = providerId,
            ServiceId = service.Id,
        };

        _db.Services.Add(service);
        _db.ProviderServices.Add(link);

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new ProviderServiceResponse
        {
            ServiceId = service.Id,
            ServiceName = service.Name,
            Description = service.Description,
            Category = service.Category,
            Country = service.Country,
            City = service.City,
            IsRemote = service.IsRemote,
            DurationMinutes = service.DurationMinutes,
            Price = service.Price,
        });
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

        if (!ServiceCategories.IsValid(request.Category))
        {
            return BadRequest(
                $"Category must be one of: {string.Join(", ", ServiceCategories.All)}.");
        }

        var service = link.Service;
        var (city, country, locationError) = ServiceLocationNormalizer.Normalize(request);

        if (locationError is not null)
            return BadRequest(locationError);

        service.Name = request.Name.Trim();
        service.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        service.Category = request.Category.Trim();
        service.Country = country;
        service.City = city;
        service.IsRemote = request.IsRemote;
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
            IsRemote = service.IsRemote,
            DurationMinutes = service.DurationMinutes,
            Price = service.Price,
        });
    }

    [HttpGet("services/{serviceId:guid}/availability")]
    public async Task<ActionResult<IEnumerable<ProviderAvailabilityResponse>>> GetServiceAvailability(
        Guid serviceId,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        if (!await OwnsActiveServiceAsync(providerId, serviceId, cancellationToken))
            return NotFound("Service not found.");

        var slots = await _db.ProviderAvailabilities
            .AsNoTracking()
            .Where(a => a.ProviderId == providerId && a.ServiceId == serviceId)
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

    [HttpPut("services/{serviceId:guid}/availability")]
    public async Task<ActionResult<IEnumerable<ProviderAvailabilityResponse>>> UpdateServiceAvailability(
        Guid serviceId,
        UpdateProviderAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var providerId))
            return Unauthorized("Invalid token: missing user id.");

        if (!await OwnsActiveServiceAsync(providerId, serviceId, cancellationToken))
            return NotFound("Service not found.");

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
            .Where(a => a.ProviderId == providerId && a.ServiceId == serviceId)
            .ToListAsync(cancellationToken);

        _db.ProviderAvailabilities.RemoveRange(existing);

        foreach (var slot in parsedSlots)
        {
            _db.ProviderAvailabilities.Add(new ProviderAvailability
            {
                ProviderId = providerId,
                ServiceId = serviceId,
                DayOfWeek = slot.DayOfWeek,
                StartTime = slot.Start,
                EndTime = slot.End,
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        var updated = await _db.ProviderAvailabilities
            .AsNoTracking()
            .Where(a => a.ProviderId == providerId && a.ServiceId == serviceId)
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

    private Task<bool> OwnsActiveServiceAsync(
        Guid providerId,
        Guid serviceId,
        CancellationToken cancellationToken) =>
        _db.ProviderServices.AsNoTracking().AnyAsync(
            ps =>
                ps.ProviderId == providerId &&
                ps.ServiceId == serviceId &&
                ps.IsActive &&
                ps.Service.IsActive,
            cancellationToken);
}
