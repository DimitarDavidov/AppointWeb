using AppointWeb.Api.Models;

namespace AppointWeb.Api.Services.Interfaces;

public interface IUserService
{
    Task<User?> GetUser(int id);
    Task<IEnumerable<User>> GetUsers();
    Task<User> CreateUser(string email);
}
