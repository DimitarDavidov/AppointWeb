using AppointWeb.Api.Data;
using AppointWeb.Api.Repositories;
using AppointWeb.Api.Repositories.Interfaces;
using AppointWeb.Api.Services;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using AppointWeb.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();


builder.Services.AddControllers();

var app = builder.Build();

app.ApplyMigrations();
app.MapControllers();

app.Run();
