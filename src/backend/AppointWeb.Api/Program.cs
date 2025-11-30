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

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();

        });
});


var app = builder.Build();

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthorization();

app.MapControllers();

app.ApplyMigrations();

app.Run();
