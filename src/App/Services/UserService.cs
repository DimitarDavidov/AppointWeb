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

    public Task<User?> GetUser(int id)
        => _repo.GetByIdAsync(id);

    public Task<IEnumerable<User>> GetUsers()
        => _repo.GetAllAsync();

    public async Task<IEnumerable<ProviderResponse>> GetProviders()
    {
        var providers = await _repo.GetByRoleAsync(UserRoles.Provider);

        return providers.Select(u => new ProviderResponse
        {
            Id = u.Id,
            Username = u.Username,
        });
    }

    public async Task<User> CreateUser(string email)
    {
        var baseUsername = email.Split('@')[0].ToLowerInvariant();
        var user = new User { Email = email, Username = baseUsername };
        return await _repo.AddAsync(user);
    }
}
