using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppointWeb.Api.Services.Interfaces;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly IUserService _service;

    public UserController(IUserService service)
    {
        _service = service;
    }

    [Authorize]
    [HttpGet("providers")]
    public async Task<IActionResult> GetProviders()
        => Ok(await _service.GetProviders());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _service.GetUser(id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
        => Ok(await _service.GetUsers());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] string email)
        => Ok(await _service.CreateUser(email));
}
