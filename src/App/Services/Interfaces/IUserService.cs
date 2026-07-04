using AppointWeb.Api.Dtos.Users;

namespace AppointWeb.Api.Services.Interfaces;

public interface IUserService
{
    Task<UserResponse?> GetUser(Guid id);
    Task<IEnumerable<UserResponse>> GetUsers();
}
