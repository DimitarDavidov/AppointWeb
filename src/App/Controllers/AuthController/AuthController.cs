using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Auth;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthController(AppDbContext db, JwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var exists = await _db.Users.AnyAsync(u => u.Email == email);
        if (exists) return Conflict("Email already registered.");

        var user = new User
        {
            Email = email,
            Role = "Customer"
        };

        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwt.CreateAccessToken(user);
        return Ok(new AuthResponse { AccessToken = token });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.SingleOrDefaultAsync(u => u.Email == email);
        if (user is null) return Unauthorized("Invalid credentials.");

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid credentials.");

        var token = _jwt.CreateAccessToken(user);
        return Ok(new AuthResponse { AccessToken = token });
    }
}