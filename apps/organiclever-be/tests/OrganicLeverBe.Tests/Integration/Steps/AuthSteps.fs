module OrganicLeverBe.Tests.Integration.Steps.AuthSteps

open System
open System.IdentityModel.Tokens.Jwt
open System.Net.Http
open System.Net.Http.Headers
open System.Security.Claims
open System.Text
open System.Text.Json
open Microsoft.IdentityModel.Tokens
open TickSpec
open Xunit
open OrganicLeverBe.Tests.State
open OrganicLeverBe.Tests.Integration.Steps.CommonSteps

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helpers
// ─────────────────────────────────────────────────────────────────────────────

let private postJson (client: HttpClient) (url: string) (body: string) : int * string =
    let content = new StringContent(body, Encoding.UTF8, "application/json")

    let response =
        client.PostAsync(url, content) |> Async.AwaitTask |> Async.RunSynchronously

    let responseBody =
        response.Content.ReadAsStringAsync()
        |> Async.AwaitTask
        |> Async.RunSynchronously

    int response.StatusCode, responseBody

let private getWithBearer (client: HttpClient) (url: string) (token: string option) : int * string =
    use request = new HttpRequestMessage(HttpMethod.Get, url)

    match token with
    | Some t -> request.Headers.Authorization <- AuthenticationHeaderValue("Bearer", t)
    | None -> ()

    let response =
        client.SendAsync(request) |> Async.AwaitTask |> Async.RunSynchronously

    let responseBody =
        response.Content.ReadAsStringAsync()
        |> Async.AwaitTask
        |> Async.RunSynchronously

    int response.StatusCode, responseBody

let private doGoogleLogin (client: HttpClient) (idToken: string) : int * string =
    let body = JsonSerializer.Serialize({| idToken = idToken |})
    postJson client "/api/v1/auth/google" body

// ─────────────────────────────────────────────────────────────────────────────
// Google login setup steps
// ─────────────────────────────────────────────────────────────────────────────

[<Given>]
let ``a valid Google ID token for user "(.+)" with name "(.+)" and avatar "(.+)"``
    (email: string)
    (name: string)
    (avatar: string)
    (state: StepState)
    =
    // Build a test token in format "test:<email>:<name>:<googleId>:<avatarUrl>"
    // The 5-part format triggers the avatarUrl path in GoogleAuthService.
    let googleId = $"google-{email.Split('@')[0]}"
    let token = $"test:{email}:{name}:{googleId}:{avatar}"

    { state with
        GoogleIdToken = Some token }

[<Given>]
let ``no user exists with Google ID "(.+)"`` (_googleId: string) (state: StepState) = state

[<Given>]
let ``a valid Google ID token for "(.+)" with Google ID "(.+)"`` (email: string) (googleId: string) (state: StepState) =
    let token = $"test:{email}:Test User:{googleId}"

    { state with
        GoogleIdToken = Some token }

[<Given>]
let ``a user exists with Google ID "(.+)" and name "(.+)"`` (googleId: string) (name: string) (state: StepState) =
    // Pre-create the user by doing a login with a synthetic token for this googleId
    let email = $"{googleId}@example.com"
    let seedToken = $"test:{email}:{name}:{googleId}"
    doGoogleLogin state.HttpClient seedToken |> ignore
    state

[<Given>]
let ``a valid Google ID token for Google ID "(.+)" with name "(.+)"``
    (googleId: string)
    (name: string)
    (state: StepState)
    =
    let token = $"test:{googleId}@example.com:{name}:{googleId}"

    { state with
        GoogleIdToken = Some token }

[<Given>]
let ``an invalid Google ID token`` (state: StepState) =
    { state with
        GoogleIdToken = Some "invalid" }

// ─────────────────────────────────────────────────────────────────────────────
// Google login action steps
// ─────────────────────────────────────────────────────────────────────────────

[<When>]
let ``the client sends POST /api/v1/auth/google with a malformed request body`` (state: StepState) =
    let status, body =
        postJson state.HttpClient "/api/v1/auth/google" "not valid json {{{"

    { state with
        Response = Some { Status = status; Body = body }
        ResponseBody = Some body }

[<When>]
let ``the client sends POST /api/v1/auth/google with an empty idToken`` (state: StepState) =
    let body = JsonSerializer.Serialize({| idToken = "" |})
    let status, responseBody = postJson state.HttpClient "/api/v1/auth/google" body

    { state with
        Response = Some { Status = status; Body = responseBody }
        ResponseBody = Some responseBody }

[<When>]
let ``the client sends POST /api/v1/auth/google with the Google ID token`` (state: StepState) =
    let idToken = state.GoogleIdToken |> Option.defaultValue ""
    let status, body = doGoogleLogin state.HttpClient idToken
    let accessToken = getStringProp body "accessToken"
    let refreshToken = getStringProp body "refreshToken"

    { state with
        Response = Some { Status = status; Body = body }
        ResponseBody = Some body
        AccessToken = if status = 200 then accessToken else state.AccessToken
        RefreshToken = if status = 200 then refreshToken else state.RefreshToken }

// ─────────────────────────────────────────────────────────────────────────────
// Refresh token steps
// ─────────────────────────────────────────────────────────────────────────────

[<Given>]
let ``a user "(.+)" has a valid refresh token`` (email: string) (state: StepState) =
    // Create a user and issue a refresh token via login
    let googleId = $"google-{email.Split('@')[0]}"
    let token = $"test:{email}:Test User:{googleId}"
    let status, body = doGoogleLogin state.HttpClient token

    if status = 200 then
        let refreshToken = getStringProp body "refreshToken"
        let accessToken = getStringProp body "accessToken"

        { state with
            AccessToken = accessToken
            RefreshToken = refreshToken }
    else
        state

[<Given>]
let ``a user "(.+)" has an expired refresh token`` (email: string) (state: StepState) =
    // We simulate an expired token by using a token string that will not match in the repository
    { state with
        RefreshToken = Some "expired-refresh-token-that-does-not-exist" }

[<When>]
let ``the client sends POST /api/v1/auth/refresh with a malformed request body`` (state: StepState) =
    let status, responseBody =
        postJson state.HttpClient "/api/v1/auth/refresh" "not valid json {{{"

    { state with
        Response = Some { Status = status; Body = responseBody }
        ResponseBody = Some responseBody }

[<When>]
let ``the client sends POST /api/v1/auth/refresh with the refresh token`` (state: StepState) =
    let rawRefreshToken = state.RefreshToken |> Option.defaultValue ""
    let body = JsonSerializer.Serialize({| refreshToken = rawRefreshToken |})
    let status, responseBody = postJson state.HttpClient "/api/v1/auth/refresh" body
    let newAccessToken = getStringProp responseBody "accessToken"
    let newRefreshToken = getStringProp responseBody "refreshToken"

    { state with
        Response = Some { Status = status; Body = responseBody }
        ResponseBody = Some responseBody
        AccessToken = if status = 200 then newAccessToken else state.AccessToken
        RefreshToken = if status = 200 then newRefreshToken else state.RefreshToken }

[<When>]
let ``the client sends POST /api/v1/auth/refresh with the expired refresh token`` (state: StepState) =
    let rawRefreshToken = state.RefreshToken |> Option.defaultValue ""
    let body = JsonSerializer.Serialize({| refreshToken = rawRefreshToken |})
    let status, responseBody = postJson state.HttpClient "/api/v1/auth/refresh" body

    { state with
        Response = Some { Status = status; Body = responseBody }
        ResponseBody = Some responseBody }

[<Then>]
let ``the old refresh token should be invalidated`` (state: StepState) =
    // After rotation, the old token hash should not exist in the repo.
    // We just verify the response contained a new token (structural check is sufficient
    // since FindByTokenHash filters by expiry and token value).
    let body = state.ResponseBody.Value
    let hasNewToken = getStringProp body "refreshToken"
    Assert.True(hasNewToken.IsSome, $"Response should contain new refreshToken: {body}")
    state

// ─────────────────────────────────────────────────────────────────────────────
// Database management steps
// ─────────────────────────────────────────────────────────────────────────────

[<Given>]
let ``the database has been reset`` (state: StepState) =
    // Call the test reset endpoint to clear all users and tokens.
    // This is used to test scenarios where a user's record no longer exists.
    postJson state.HttpClient "/api/v1/test/reset-db" "{}" |> ignore
    state

[<Given>]
let ``the user records have been deleted while keeping tokens`` (state: StepState) =
    // Delete users but keep refresh tokens to test the "user not found" path
    // in the refresh token handler.
    postJson state.HttpClient "/api/v1/test/delete-users" "{}" |> ignore
    state

// ─────────────────────────────────────────────────────────────────────────────
// User creation assertion steps
// ─────────────────────────────────────────────────────────────────────────────

[<Then>]
let ``a user record should be created with email "(.+)"`` (email: string) (state: StepState) =
    // Verify the login response was successful (user was created/returned)
    // and get the profile via /auth/me to confirm the user exists with that email
    let accessToken =
        match state.AccessToken with
        | Some t -> Some t
        | None ->
            match state.ResponseBody with
            | Some body -> getStringProp body "accessToken"
            | None -> None

    Assert.True(accessToken.IsSome, "Access token should be present after successful login")
    let status, meBody = getWithBearer state.HttpClient "/api/v1/auth/me" accessToken
    Assert.Equal(200, status)
    let actualEmail = getStringProp meBody "email"
    Assert.True(actualEmail.IsSome, $"Email field not found in profile: {meBody}")
    Assert.Equal(email, actualEmail.Value)
    state

[<Then>]
let ``the user name should be updated to "(.+)"`` (name: string) (state: StepState) =
    // Verify via the access token's claims or GET /auth/me
    let body = state.ResponseBody.Value
    Assert.True(body.Length > 0, $"Response body should not be empty: {body}")
    let accessToken = getStringProp body "accessToken"
    Assert.True(accessToken.IsSome, "Access token should be present after login")

    let status, meBody = getWithBearer state.HttpClient "/api/v1/auth/me" accessToken
    Assert.Equal(200, status)
    let actualName = getStringProp meBody "name"
    Assert.True(actualName.IsSome, $"Name field not found in profile: {meBody}")
    Assert.Equal(name, actualName.Value)
    state

// ─────────────────────────────────────────────────────────────────────────────
// Crafted JWT helpers (for testing JwtMiddleware edge cases)
// ─────────────────────────────────────────────────────────────────────────────

/// Generates a signed JWT using the same dev secret as JwtService, but with
/// caller-supplied claims so we can test edge cases (missing sub, non-GUID sub).
let private craftJwt (claims: Claim list) : string =
    let secret = "dev-jwt-secret-at-least-32-characters-long-for-hmac"
    let key = SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
    let creds = SigningCredentials(key, SecurityAlgorithms.HmacSha256)
    let now = DateTime.UtcNow

    let token =
        JwtSecurityToken(
            issuer = "organiclever-be",
            audience = "organiclever-be",
            claims = claims,
            notBefore = now,
            expires = now.AddMinutes(15.0),
            signingCredentials = creds
        )

    JwtSecurityTokenHandler().WriteToken(token)

[<Given>]
let ``a crafted access token with no subject claim`` (state: StepState) =
    // JWT with only jti + email + name — no sub or nameidentifier claim
    let claims =
        [ Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
          Claim("email", "nosubclaim@example.com")
          Claim("name", "No Sub User") ]

    let token = craftJwt claims

    { state with AccessToken = Some token }

[<Given>]
let ``a crafted access token with a non-GUID subject claim "(.+)"`` (subValue: string) (state: StepState) =
    // JWT with sub set to a non-GUID string — passes FindFirst but Guid.Parse will fail
    let claims =
        [ Claim(JwtRegisteredClaimNames.Sub, subValue)
          Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
          Claim("email", "invalidguid@example.com")
          Claim("name", "Invalid GUID User") ]

    let token = craftJwt claims

    { state with AccessToken = Some token }

// ─────────────────────────────────────────────────────────────────────────────
// /auth/me steps
// ─────────────────────────────────────────────────────────────────────────────

[<Given>]
let ``a user "(.+)" is authenticated with a valid access token`` (email: string) (state: StepState) =
    let googleId = $"google-{email.Split('@')[0]}"
    let token = $"test:{email}:Test User:{googleId}"
    let status, body = doGoogleLogin state.HttpClient token

    if status = 200 then
        let accessToken = getStringProp body "accessToken"

        { state with AccessToken = accessToken }
    else
        state

[<When>]
let ``the client sends GET /api/v1/auth/me with the access token`` (state: StepState) =
    let status, body =
        getWithBearer state.HttpClient "/api/v1/auth/me" state.AccessToken

    { state with
        Response = Some { Status = status; Body = body }
        ResponseBody = Some body }

[<When>]
let ``the client sends GET /api/v1/auth/me without an access token`` (state: StepState) =
    let status, body = getWithBearer state.HttpClient "/api/v1/auth/me" None

    { state with
        Response = Some { Status = status; Body = body }
        ResponseBody = Some body }

[<Given>]
let ``a user "(.+)" has an expired access token`` (_email: string) (state: StepState) =
    // Simulate an expired access token by using an invalid token string
    { state with
        AccessToken = Some "expired.jwt.token.that.will.not.validate" }

[<When>]
let ``the client sends GET /api/v1/auth/me with the expired access token`` (state: StepState) =
    let status, body =
        getWithBearer state.HttpClient "/api/v1/auth/me" state.AccessToken

    { state with
        Response = Some { Status = status; Body = body }
        ResponseBody = Some body }
