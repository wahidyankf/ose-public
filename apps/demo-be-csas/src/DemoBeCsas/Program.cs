using System.Text;
using DemoBeCsas.Auth;
using DemoBeCsas.Endpoints;
using DemoBeCsas.Infrastructure;
using DemoBeCsas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.WebHost.UseUrls($"http://+:{builder.Configuration["PORT"] ?? "8201"}");

// Database
var databaseUrl = builder.Configuration["DATABASE_URL"];
if (!string.IsNullOrEmpty(databaseUrl))
{
    builder.Services.AddDbContext<AppDbContext>(opts => opts.UseNpgsql(databaseUrl));
}

// Authentication
var jwtSecret =
    builder.Configuration["APP_JWT_SECRET"]
    ?? throw new InvalidOperationException("APP_JWT_SECRET is required");

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        // Disable inbound claim type mapping so JWT claim names are preserved as-is
        // (e.g. "role" stays "role" instead of being remapped to ClaimTypes.Role URL)
        opts.MapInboundClaims = false;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };
    });

// Authorization
builder.Services.AddDemoBeAuthorization();

// Repositories and services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<IAttachmentRepository, AttachmentRepository>();
builder.Services.AddScoped<IRevokedTokenRepository, RevokedTokenRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtService, JwtService>();

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TokenRevocationMiddleware>();

// Endpoints
app.MapHealthEndpoints();
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapAdminEndpoints();
app.MapExpenseEndpoints();
app.MapReportEndpoints();
app.MapAttachmentEndpoints();
app.MapTokenEndpoints();

await app.RunAsync();

// Needed for WebApplicationFactory in integration tests
#pragma warning disable S1118 // Add a 'protected' constructor or the 'static' keyword to the class declaration
public partial class Program { }
#pragma warning restore S1118
