using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Users;
using AppointWeb.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserController(AppDbContext db)
    {
        _db = db;
    }

    [Authorize]
    [HttpGet("providers")]
    public async Task<ActionResult<IEnumerable<ProviderResponse>>> GetProviders(
        CancellationToken ct)
    {
        var providers = await _db.Users
            .AsNoTracking()
            .Where(u => u.Role == UserRoles.Provider)
            .OrderBy(u => u.Username)
            .Select(u => new ProviderResponse
            {
                Id = u.Id,
                Username = u.Username,
            })
            .ToListAsync(ct);

        return Ok(providers);
    }
}
