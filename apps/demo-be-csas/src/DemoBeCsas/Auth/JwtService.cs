using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace DemoBeCsas.Auth;

public interface IJwtService
{
    string CreateAccessToken(string userId, string username, string role);
    string CreateRefreshToken(string userId);
    ClaimsPrincipal? DecodeToken(string token);
    string? GetJti(string token);
    DateTimeOffset? GetIssuedAt(string token);
}

public class JwtService(IConfiguration config) : IJwtService
{
    private readonly string _secret =
        config["APP_JWT_SECRET"]
        ?? throw new InvalidOperationException("APP_JWT_SECRET not configured");

    private SymmetricSecurityKey Key =>
        new(Encoding.UTF8.GetBytes(_secret));

    public string CreateAccessToken(string userId, string username, string role)
    {
        var creds = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256);
        var jti = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow;

        var token = new JwtSecurityToken(
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("username", username),
                new Claim("role", role),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
                new Claim(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            ],
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string CreateRefreshToken(string userId)
    {
        var creds = new SigningCredentials(Key, SecurityAlgorithms.HmacSha256);
        var jti = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow;

        var token = new JwtSecurityToken(
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("token_type", "refresh"),
                new Claim(JwtRegisteredClaimNames.Jti, jti),
                new Claim(JwtRegisteredClaimNames.Iat, now.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            ],
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? DecodeToken(string token)
    {
        // Disable inbound claim type mapping to preserve original JWT claim names (e.g. "sub" stays "sub")
        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        var validationParams = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = Key,
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };

        try
        {
            return handler.ValidateToken(token, validationParams, out _);
        }
        catch
        {
            return null;
        }
    }

    public string? GetJti(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            return jwt.Id;
        }
        catch
        {
            return null;
        }
    }

    public DateTimeOffset? GetIssuedAt(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwt = handler.ReadJwtToken(token);
            return jwt.IssuedAt == default
                ? null
                : new DateTimeOffset(jwt.IssuedAt, TimeSpan.Zero);
        }
        catch
        {
            return null;
        }
    }
}
