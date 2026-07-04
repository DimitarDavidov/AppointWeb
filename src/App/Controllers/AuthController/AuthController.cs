using AppointWeb.Api.Data;
using AppointWeb.Api.Dtos.Auth;
using AppointWeb.Api.Models;
using AppointWeb.Api.Services;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;
    private readonly IPasswordResetService _passwordResetService;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthController(
        AppDbContext db,
        JwtTokenService jwt,
        IPasswordResetService passwordResetService)
    {
        _db = db;
        _jwt = jwt;
        _passwordResetService = passwordResetService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var username = request.Username.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == email))
            return Conflict("Email already registered.");

        if (await _db.Users.AnyAsync(u => u.Username == username))
            return Conflict("Username already taken.");

        var user = new User
        {
            Email = email,
            Username = username,
            Role = "Customer"
        };

        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwt.CreateAccessToken(user);
        return Ok(new AuthResponse
        {
            AccessToken = token,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role
        });
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
        return Ok(new AuthResponse
        {
            AccessToken = token,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role
        });
    }

    [EnableRateLimiting("ForgotPassword")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await _passwordResetService.RequestResetAsync(request.Email, cancellationToken);

        return Ok(new
        {
            message =
                "If an account exists for this email, password reset instructions have been sent."
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var success = await _passwordResetService.ResetPasswordAsync(
            request.Token,
            request.NewPassword,
            cancellationToken);

        if (!success)
        {
            return BadRequest(
                "Invalid or expired reset link. Please request a new one.");
        }

        return Ok(new { message = "Password has been reset successfully." });
    }
}