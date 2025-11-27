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

    public async Task<User> CreateUser(string email)
    {
        var user = new User { Email = email };
        return await _repo.AddAsync(user);
    }
}
