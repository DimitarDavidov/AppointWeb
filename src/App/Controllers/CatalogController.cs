using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Catalog;
using AppointWeb.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly AppDbContext _db;

    public CatalogController(AppDbContext db)
    {
        _db = db;
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
                DurationMinutes = ps.Service.DurationMinutes,
                Price = ps.Service.Price
            });
    }
}
