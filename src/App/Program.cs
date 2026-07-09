using AppointWeb.Api.Data;
using AppointWeb.Api.Data.Seeding;
using AppointWeb.Api.Options;
using AppointWeb.Api.Services;
using AppointWeb.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using AppointWeb.Api.Extensions;
using AppointWeb.Api.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;


var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var connectionString = ConnectionStringResolver.Resolve(builder.Configuration);

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string is not configured. Set ConnectionStrings__DefaultConnection or link a PostgreSQL service.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();
builder.Services.AddScoped<IAccountDeletionService, AccountDeletionService>();
builder.Services.AddScoped<BookingSlotService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<FrontendSettings>(builder.Configuration.GetSection("Frontend"));

var emailApiKey = builder.Configuration["Email:ApiKey"];
var emailHost = builder.Configuration["Email:Host"];

if (!string.IsNullOrWhiteSpace(emailApiKey))
{
    builder.Services.AddHttpClient<IEmailService, ResendEmailService>();
    Console.WriteLine("Email provider: Resend (HTTPS API)");
}
else if (!string.IsNullOrWhiteSpace(emailHost))
{
    builder.Services.AddScoped<IEmailService, SmtpEmailService>();
    Console.WriteLine("Email provider: SMTP");
}
else
{
    builder.Services.AddScoped<IEmailService, LoggingEmailService>();
    Console.WriteLine("Email provider: console logging (no email configured)");
}

builder.Services.AddControllers();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("ForgotPassword", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                Window = TimeSpan.FromMinutes(15),
                PermitLimit = 5,
                QueueLimit = 0
            }));
});

var frontendBaseUrl = builder.Configuration["Frontend:BaseUrl"]?.Trim().TrimEnd('/');
var corsOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "http://localhost:5173",
    "https://localhost:5173"
};

if (!string.IsNullOrWhiteSpace(frontendBaseUrl))
{
    corsOrigins.Add(frontendBaseUrl);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(corsOrigins.ToArray())
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();

        });
});


var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]!;
var issuer = jwtSection["Issuer"]!;
var audience = jwtSection["Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<JwtTokenService>();

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        Console.WriteLine("Checking database connection...");
        db.Database.OpenConnection();
        db.Database.CloseConnection();
        Console.WriteLine("Database connection OK");
    }
    catch (Exception ex)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine("DB Connection failed");
        Console.ResetColor();

        Console.WriteLine(ex.ToString());

        throw new InvalidOperationException("Backend startup aborted due to database connection failure.", ex);
    }
}

app.ApplyMigrations();

using (var seedScope = app.Services.CreateScope())
{
    var seedDb = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DatabaseSeeder.SeedAsync(seedDb);
}

if (args.Contains("seed"))
{
    using var seedScope = app.Services.CreateScope();
    var seedDb = seedScope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DatabaseSeeder.SeedAsync(seedDb);
    return;
}

app.UseRouting();
app.UseCors("AllowFrontend");

app.UseRateLimiter();

app.UseAuthentication();
app.UseMiddleware<SuspendedUserMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
