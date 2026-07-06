using System.Text.Json;
using AppointWeb.Api.Data;
using AppointWeb.Api.Extensions;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Middleware;

public class SuspendedUserMiddleware
{
    private readonly RequestDelegate _next;

    public SuspendedUserMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.User.Identity?.IsAuthenticated == true &&
            context.User.TryGetUserId(out var userId))
        {
            var isSuspended = await db.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.IsSuspended)
                .SingleOrDefaultAsync(context.RequestAborted);

            if (isSuspended)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(
                    JsonSerializer.Serialize("This account has been suspended."));
                return;
            }
        }

        await _next(context);
    }
}
