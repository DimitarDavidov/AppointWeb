using AppointWeb.Api.Models;

namespace AppointWeb.Api.Dtos.Auth;

public static class AuthResponseMapper
{
    public static AuthResponse MapAuthResponse(User user, string accessToken) =>
        new()
        {
            AccessToken = accessToken,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role,
        };
}
