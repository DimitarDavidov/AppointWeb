using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _db;

    public ServicesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ServiceResponse>>> GetAll(CancellationToken ct)
    {
        var services = await _db.Services
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new ServiceResponse
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Country = s.Country,
                City = s.City,
                DurationMinutes = s.DurationMinutes,
                Price = s.Price
            })
            .ToListAsync(ct);

        return Ok(services);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ServiceResponse>> GetById(Guid id, CancellationToken ct)
    {
        var service = await _db.Services
            .AsNoTracking()
            .Where(s => s.Id == id && s.IsActive)
            .Select(s => new ServiceResponse
            {
                Id = s.Id,
                Name = s.Name,
                Description = s.Description,
                Country = s.Country,
                City = s.City,
                DurationMinutes = s.DurationMinutes,
                Price = s.Price
            })
            .SingleOrDefaultAsync(ct);

        return service is null ? NotFound() : Ok(service);
    }
}
