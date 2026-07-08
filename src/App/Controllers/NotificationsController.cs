using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Notifications;
using AppointWeb.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private const int MaxNotifications = 50;

    private readonly AppDbContext _db;

    public NotificationsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetMine(
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var notifications = await _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(MaxNotifications)
            .Select(n => new NotificationResponse
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                AppointmentId = n.AppointmentId,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountResponse>> GetUnreadCount(
        CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var count = await _db.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead, ct);

        return Ok(new UnreadCountResponse { Count = count });
    }

    [HttpPatch("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        var notification = await _db.Notifications
            .SingleOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);

        if (notification is null)
            return NotFound();

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _db.SaveChangesAsync(ct);
        }

        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId))
            return Unauthorized("Invalid token: missing user id.");

        await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(n => n.IsRead, true),
                ct);

        return NoContent();
    }
}
