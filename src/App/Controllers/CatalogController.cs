using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Catalog;
using AppointWeb.Api.Dtos.Ratings;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly BookingSlotService _bookingSlots;

    public CatalogController(AppDbContext db, BookingSlotService bookingSlots)
    {
        _db = db;
        _bookingSlots = bookingSlots;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CatalogOfferingResponse>>> GetAll(
        CancellationToken ct)
    {
        var offerings = await QueryActiveOfferings()
            .OrderBy(o => o.ServiceName)
            .ThenBy(o => o.ProviderUsername)
            .ToListAsync(ct);

        return Ok(offerings);
    }

    [HttpGet("{providerId:guid}/{serviceId:guid}")]
    public async Task<ActionResult<CatalogOfferingResponse>> GetOffering(
        Guid providerId,
        Guid serviceId,
        CancellationToken ct)
    {
        var offering = await QueryActiveOfferings()
            .Where(o => o.ProviderId == providerId && o.ServiceId == serviceId)
            .SingleOrDefaultAsync(ct);

        return offering is null ? NotFound() : Ok(offering);
    }

    [HttpGet("{providerId:guid}/{serviceId:guid}/slots")]
    public async Task<ActionResult<BookingSlotsResponse>> GetBookingSlots(
        Guid providerId,
        Guid serviceId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var fromUtc = (from ?? DateTime.UtcNow.Date).Kind switch
        {
            DateTimeKind.Utc => from ?? DateTime.UtcNow.Date,
            _ => DateTime.SpecifyKind((from ?? DateTime.UtcNow.Date), DateTimeKind.Utc),
        };

        var toUtc = (to ?? fromUtc.AddDays(42)).Kind switch
        {
            DateTimeKind.Utc => to ?? fromUtc.AddDays(42),
            _ => DateTime.SpecifyKind((to ?? fromUtc.AddDays(42)), DateTimeKind.Utc),
        };

        if (toUtc < fromUtc)
            return BadRequest("'to' must be on or after 'from'.");

        var result = await _bookingSlots.GetAvailableSlotsAsync(
            providerId,
            serviceId,
            fromUtc,
            toUtc,
            ct);

        if (result is null)
            return NotFound();

        return Ok(new BookingSlotsResponse
        {
            DurationMinutes = result.Value.DurationMinutes,
            Slots = result.Value.Slots.Select(s => s.ToString("O")).ToList(),
        });
    }

    private IQueryable<CatalogOfferingResponse> QueryActiveOfferings()
    {
        return _db.ProviderServices
            .AsNoTracking()
            .Where(ps =>
                ps.IsActive &&
                ps.Service.IsActive &&
                ps.Provider.Role == UserRoles.Provider)
            .Select(ps => new CatalogOfferingResponse
            {
                ProviderId = ps.ProviderId,
                ProviderUsername = ps.Provider.Username,
                ServiceId = ps.ServiceId,
                ServiceName = ps.Service.Name,
                Description = ps.Service.Description,
                Category = ps.Service.Category,
                Country = ps.Service.Country,
                City = ps.Service.City,
                IsRemote = ps.Service.IsRemote,
                DurationMinutes = ps.Service.DurationMinutes,
                Price = ps.Service.Price,
                AverageRating = ps.Service.Ratings
                    .Where(r =>
                        r.RateeId == ps.ProviderId &&
                        r.Direction == RatingDirection.CustomerToProvider &&
                        r.Stars != null &&
                        (r.Appointment.Status == AppointmentStatus.Completed ||
                         r.Appointment.Status == AppointmentStatus.NoShow))
                    .Average(r => (double?)r.Stars),
                RatingCount = ps.Service.Ratings
                    .Count(r =>
                        r.RateeId == ps.ProviderId &&
                        r.Direction == RatingDirection.CustomerToProvider &&
                        r.Stars != null &&
                        (r.Appointment.Status == AppointmentStatus.Completed ||
                         r.Appointment.Status == AppointmentStatus.NoShow)),
            });
    }

    [HttpGet("{providerId:guid}/{serviceId:guid}/reviews")]
    public async Task<ActionResult<ServiceReviewsResponse>> GetReviews(
        Guid providerId,
        Guid serviceId,
        CancellationToken ct)
    {
        var publicRatings = _db.Ratings
            .AsNoTracking()
            .Where(r =>
                r.RateeId == providerId &&
                r.ServiceId == serviceId &&
                r.Direction == RatingDirection.CustomerToProvider &&
                (r.Appointment.Status == AppointmentStatus.Completed ||
                 r.Appointment.Status == AppointmentStatus.NoShow));

        var response = new ServiceReviewsResponse
        {
            AverageRating = await publicRatings
                .Where(r => r.Stars != null)
                .AverageAsync(r => (double?)r.Stars, ct),
            RatingCount = await publicRatings.CountAsync(r => r.Stars != null, ct),
            Reviews = await publicRatings
                .Where(r => r.Comment != null)
                .OrderByDescending(r => r.UpdatedAt)
                .Select(r => new ServiceReviewResponse
                {
                    Stars = r.Stars,
                    Comment = r.Comment,
                    ReviewerId = r.RaterId,
                    ReviewerUsername = r.Rater.Username,
                    CreatedAt = r.CreatedAt,
                })
                .ToListAsync(ct),
        };

        return Ok(response);
    }
}
