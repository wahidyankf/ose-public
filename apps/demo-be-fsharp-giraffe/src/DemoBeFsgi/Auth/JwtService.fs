module DemoBeFsgi.Auth.JwtService

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

let generateAccessToken (userId: Guid) (username: string) (email: string) (role: string) : string =
    let now = DateTime.UtcNow
    let jti = Guid.NewGuid().ToString()

    let claims =
        [| Claim(JwtRegisteredClaimNames.Sub, userId.ToString())
           Claim(JwtRegisteredClaimNames.Jti, jti)
           Claim("username", username)
           Claim("email", email)
           Claim("role", role) |]

    let signingCreds =
        SigningCredentials(getSigningKey (), SecurityAlgorithms.HmacSha256)

    let token =
        JwtSecurityToken(
            issuer = "demo-be-fsharp-giraffe",
            audience = "demo-be-fsharp-giraffe",
            claims = claims,
            notBefore = now,
            expires = now.AddMinutes(15.0),
            signingCredentials = signingCreds
        )

    JwtSecurityTokenHandler().WriteToken(token)

let generateRefreshToken (userId: Guid) : string =
    let now = DateTime.UtcNow
    let jti = Guid.NewGuid().ToString()

    let claims =
        [| Claim(JwtRegisteredClaimNames.Sub, userId.ToString())
           Claim(JwtRegisteredClaimNames.Jti, jti)
           Claim("token_type", "refresh") |]

    let signingCreds =
        SigningCredentials(getSigningKey (), SecurityAlgorithms.HmacSha256)

    let token =
        JwtSecurityToken(
            issuer = "demo-be-fsharp-giraffe",
            audience = "demo-be-fsharp-giraffe",
            claims = claims,
            notBefore = now,
            expires = now.AddDays(7.0),
            signingCredentials = signingCreds
        )

    JwtSecurityTokenHandler().WriteToken(token)

let validateToken (token: string) : ClaimsPrincipal option =
    let handler = JwtSecurityTokenHandler()
    let key = getSigningKey ()

    let validationParams =
        TokenValidationParameters(
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = "demo-be-fsharp-giraffe",
            ValidateAudience = true,
            ValidAudience = "demo-be-fsharp-giraffe",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        )

    try
        let mutable securityToken: SecurityToken = null
        let principal = handler.ValidateToken(token, validationParams, &securityToken)
        Some principal
    with _ ->
        None

let getTokenJti (token: string) : string option =
    try
        let handler = JwtSecurityTokenHandler()
        let jwt = handler.ReadJwtToken(token)

        let jtiClaim =
            jwt.Claims |> Seq.tryFind (fun c -> c.Type = JwtRegisteredClaimNames.Jti)

        jtiClaim |> Option.map (fun c -> c.Value)
    with _ ->
        None

let getTokenExpiry (token: string) : DateTime option =
    try
        let handler = JwtSecurityTokenHandler()
        let jwt = handler.ReadJwtToken(token)
        Some jwt.ValidTo
    with _ ->
        None

let getJwks () =
    let key = getSigningKey ()
    let keyId = "demo-be-fsharp-giraffe-key-1"

    let jwk =
        {| kty = "oct"
           kid = keyId
           alg = "HS256"
           use_ = "sig"
           k = Convert.ToBase64String(key.Key) |}

    {| keys =
        [| {| kty = jwk.kty
              kid = jwk.kid
              alg = jwk.alg
              ``use`` = jwk.use_ |} |] |}
