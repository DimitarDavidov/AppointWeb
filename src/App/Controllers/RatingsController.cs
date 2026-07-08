using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Appointments;
using AppointWeb.Api.Dtos.Ratings;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RatingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public RatingsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Returns the current user's own rating for an appointment, or 204 if none.</summary>
    [HttpGet("appointments/{appointmentId:guid}")]
    public async Task<ActionResult<RatingResponse>> GetMine(
        Guid appointmentId,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var rating = await _db.Ratings
            .AsNoTracking()
            .SingleOrDefaultAsync(
                r => r.AppointmentId == appointmentId && r.RaterId == userId,
                ct);

        if (rating is null)
            return NoContent();

        return Ok(RatingMapper.MapResponse(rating));
    }

    /// <summary>
    /// Returns a customer's overall rating received from providers (stars only, no comments).
    /// </summary>
    [HttpGet("customers/{customerId:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<RatingAggregateResponse>> GetCustomerRating(
        Guid customerId,
        CancellationToken ct)
    {
        var ratings = _db.Ratings
            .AsNoTracking()
            .Where(r =>
                r.RateeId == customerId &&
                r.Direction == RatingDirection.ProviderToCustomer);

        return Ok(await AggregateAsync(ratings, ct));
    }

    /// <summary>
    /// Returns the current user's own received ratings: as a customer (from providers)
    /// and, for providers, as a provider (from customers). Stars only, no comments.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserRatingSummaryResponse>> GetMyRatings(
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var asCustomer = _db.Ratings
            .AsNoTracking()
            .Where(r =>
                r.RateeId == userId &&
                r.Direction == RatingDirection.ProviderToCustomer);

        var asProvider = _db.Ratings
            .AsNoTracking()
            .Where(r =>
                r.RateeId == userId &&
                r.Direction == RatingDirection.CustomerToProvider &&
                (r.Appointment.Status == AppointmentStatus.Completed ||
                 r.Appointment.Status == AppointmentStatus.NoShow));

        return Ok(new UserRatingSummaryResponse
        {
            AsCustomer = await AggregateAsync(asCustomer, ct),
            AsProvider = await AggregateAsync(asProvider, ct),
        });
    }

    private static async Task<RatingAggregateResponse> AggregateAsync(
        IQueryable<Rating> ratings,
        CancellationToken ct)
    {
        var withStars = ratings.Where(r => r.Stars != null);

        return new RatingAggregateResponse
        {
            AverageRating = await withStars.AverageAsync(r => (double?)r.Stars, ct),
            RatingCount = await withStars.CountAsync(ct),
        };
    }

    /// <summary>Creates or updates the current user's rating for an appointment.</summary>
    [HttpPut("appointments/{appointmentId:guid}")]
    public async Task<ActionResult<RatingResponse>> Upsert(
        Guid appointmentId,
        SubmitRatingRequest request,
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var appointment = await _db.Appointments
            .SingleOrDefaultAsync(a => a.Id == appointmentId, ct);

        if (appointment is null)
            return NotFound("Appointment not found.");

        var isCustomer = appointment.CustomerId == userId;
        var isProvider = appointment.ProviderId == userId;

        if (!isCustomer && !isProvider)
            return Forbid();

        if (!AppointmentStatusMapper.CanBeRated(appointment.Status))
        {
            return BadRequest(
                "You can only leave a rating once the appointment is completed, did not take place, or was cancelled.");
        }

        var comment = string.IsNullOrWhiteSpace(request.Comment)
            ? null
            : request.Comment.Trim();

        if (request.Stars is null && comment is null)
            return BadRequest("Add a star rating or a comment.");

        if (request.Stars is not null && !RatingMapper.IsValidStars(request.Stars.Value))
            return BadRequest("Stars must be between 0.5 and 5 in half-star steps.");

        var direction = isCustomer
            ? RatingDirection.CustomerToProvider
            : RatingDirection.ProviderToCustomer;
        var rateeId = isCustomer ? appointment.ProviderId : appointment.CustomerId;

        var rating = await _db.Ratings.SingleOrDefaultAsync(
            r => r.AppointmentId == appointmentId && r.Direction == direction,
            ct);

        if (rating is null)
        {
            rating = new Rating
            {
                AppointmentId = appointment.Id,
                ServiceId = appointment.ServiceId,
                RaterId = userId,
                RateeId = rateeId,
                Direction = direction,
                Stars = request.Stars,
                Comment = comment,
            };
            _db.Ratings.Add(rating);
        }
        else
        {
            rating.Stars = request.Stars;
            rating.Comment = comment;
            rating.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);

        return Ok(RatingMapper.MapResponse(rating));
    }

    /// <summary>Removes the current user's rating for an appointment.</summary>
    [HttpDelete("appointments/{appointmentId:guid}")]
    public async Task<IActionResult> Delete(Guid appointmentId, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var rating = await _db.Ratings.SingleOrDefaultAsync(
            r => r.AppointmentId == appointmentId && r.RaterId == userId,
            ct);

        if (rating is null)
            return NotFound();

        _db.Ratings.Remove(rating);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}
