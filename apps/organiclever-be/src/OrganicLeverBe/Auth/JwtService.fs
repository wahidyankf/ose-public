module OrganicLeverBe.Auth.JwtService

open System
open System.IdentityModel.Tokens.Jwt
open System.Security.Claims
open System.Text
open Microsoft.IdentityModel.Tokens

let private getSecret () =
    let s = Environment.GetEnvironmentVariable("APP_JWT_SECRET")

    if String.IsNullOrEmpty s then
        "dev-jwt-secret-at-least-32-characters-long-for-hmac"
    else
        s

let private getSigningKey () =
    let key = Encoding.UTF8.GetBytes(getSecret ())
    SymmetricSecurityKey(key)

let generateAccessToken (userId: Guid) (email: string) (name: string) : string =
    let now = DateTime.UtcNow
    let jti = Guid.NewGuid().ToString()

    let claims =
        [| Claim(JwtRegisteredClaimNames.Sub, userId.ToString())
           Claim(JwtRegisteredClaimNames.Jti, jti)
           Claim("email", email)
           Claim("name", name) |]

    let signingCreds =
        SigningCredentials(getSigningKey (), SecurityAlgorithms.HmacSha256)

    let token =
        JwtSecurityToken(
            issuer = "organiclever-be",
            audience = "organiclever-be",
            claims = claims,
            notBefore = now,
            expires = now.AddMinutes(15.0),
            signingCredentials = signingCreds
        )

    JwtSecurityTokenHandler().WriteToken(token)

let generateRawRefreshToken () : string =
    let bytes = Array.zeroCreate<byte> 32
    use rng = System.Security.Cryptography.RandomNumberGenerator.Create()
    rng.GetBytes(bytes)
    Convert.ToBase64String(bytes)

let hashToken (token: string) : string =
    use sha256 = System.Security.Cryptography.SHA256.Create()
    let bytes = Encoding.UTF8.GetBytes(token)
    let hash = sha256.ComputeHash(bytes)
    Convert.ToBase64String(hash)

let validateToken (token: string) : ClaimsPrincipal option =
    let handler = JwtSecurityTokenHandler()
    let key = getSigningKey ()

    let validationParams =
        TokenValidationParameters(
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = "organiclever-be",
            ValidateAudience = true,
            ValidAudience = "organiclever-be",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        )

    try
        let mutable securityToken: SecurityToken = null
        let principal = handler.ValidateToken(token, validationParams, &securityToken)
        Some principal
    with _ ->
        None
