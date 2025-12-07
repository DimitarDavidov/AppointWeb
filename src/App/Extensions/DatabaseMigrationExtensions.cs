using AppointWeb.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace AppointWeb.Api.Extensions;

public static class DatabaseMigrationExtensions
{
    public static IApplicationBuilder ApplyMigrations(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        db.Database.EnsureCreated();

        return app;
    }
}
