using AppointWeb.Api.Dtos.Users;
using AppointWeb.Api.Models;
using AppointWeb.Api.Repositories.Interfaces;
using AppointWeb.Api.Services.Interfaces;

namespace AppointWeb.Api.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repo;

    public UserService(IUserRepository repo)
    {
        _repo = repo;
    }

    public async Task<UserResponse?> GetUser(Guid id)
    {
        var user = await _repo.GetByIdAsync(id);
        return user is null ? null : ToResponse(user);
    }

    public async Task<IEnumerable<UserResponse>> GetUsers()
    {
        var users = await _repo.GetAllAsync();
        return users.Select(ToResponse);
    }

    private static UserResponse ToResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Username = user.Username,
        Role = user.Role,
        CreatedAt = user.CreatedAt
    };
}
