/// Direct service layer for integration tests.
///
/// Each function mirrors a Giraffe handler but works entirely via repository function records —
/// no HTTP, no HttpContext, no WebApplicationFactory. Each function returns a
/// (status: int * body: string) pair that the step definitions treat as a
/// simulated HTTP response, preserving the HTTP-oriented Gherkin language.
module OrganicLeverBe.Tests.DirectServices

open System
open System.Text.Json
open OrganicLeverBe.Infrastructure.AppDbContext
open OrganicLeverBe.Infrastructure.Repositories.RepositoryTypes
open OrganicLeverBe.Auth.GoogleAuthService
open OrganicLeverBe.Auth.JwtService

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let private opts = JsonSerializerOptions(PropertyNameCaseInsensitive = true)

let private ok (payload: obj) =
    200, JsonSerializer.Serialize(payload, opts)

let private badRequest (message: string) =
    400,
    JsonSerializer.Serialize(
        {| error = "Bad Request"
           message = message |},
        opts
    )

let private unauthorized (message: string) =
    401,
    JsonSerializer.Serialize(
        {| error = "Unauthorized"
           message = message |},
        opts
    )

let private notFound (message: string) =
    404,
    JsonSerializer.Serialize(
        {| error = "Not Found"
           message = message |},
        opts
    )

// ─────────────────────────────────────────────────────────────────────────────
// Token auth — resolves a JWT to a UserId (replaces requireAuth middleware)
// ─────────────────────────────────────────────────────────────────────────────

/// Validates the JWT token string against the repositories.
/// Returns Ok userId or Error (status, body).
let resolveAuth (userRepo: UserRepository) (token: string option) : Async<Result<Guid, int * string>> =
    async {
        match token with
        | None -> return Error(unauthorized "Missing or invalid Authorization header")
        | Some t ->
            let principal = validateToken t

            match principal with
            | None -> return Error(unauthorized "Invalid or expired token")
            | Some claims ->
                let sub =
                    claims.FindFirst(fun c ->
                        c.Type = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")

                let sub2 =
                    if sub = null then
                        claims.FindFirst(fun c -> c.Type = "sub")
                    else
                        sub

                if sub2 = null then
                    return Error(unauthorized "Invalid token claims")
                else
                    let userId =
                        try
                            Guid.Parse(sub2.Value) |> Some
                        with _ ->
                            None

                    match userId with
                    | None -> return Error(unauthorized "Invalid user ID in token")
                    | Some uid ->
                        let! userOpt = userRepo.FindById uid |> Async.AwaitTask

                        match userOpt with
                        | None -> return Error(unauthorized "User not found")
                        | Some _ -> return Ok uid
    }

// ─────────────────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────────────────

let health () : int * string = ok {| status = "UP" |}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

let googleLogin
    (userRepo: UserRepository)
    (rtRepo: RefreshTokenRepository)
    (googleAuthSvc: GoogleAuthService)
    (idToken: string)
    : Async<int * string> =
    async {
        if String.IsNullOrEmpty idToken then
            return badRequest "idToken is required"
        else
            let! verifyResult = googleAuthSvc.VerifyToken idToken |> Async.AwaitTask

            match verifyResult with
            | Error msg -> return unauthorized msg
            | Ok payload ->
                let! existingOpt = userRepo.FindByGoogleId payload.GoogleId |> Async.AwaitTask

                let! user =
                    match existingOpt with
                    | Some existing ->
                        let updated =
                            { existing with
                                Name = payload.Name
                                AvatarUrl = payload.AvatarUrl |> Option.defaultValue existing.AvatarUrl
                                UpdatedAt = DateTime.UtcNow }

                        userRepo.Update updated |> Async.AwaitTask
                    | None ->
                        let now = DateTime.UtcNow

                        let newUser: UserEntity =
                            { Id = Guid.NewGuid()
                              Email = payload.Email
                              Name = payload.Name
                              AvatarUrl = payload.AvatarUrl |> Option.defaultValue null
                              GoogleId = payload.GoogleId
                              CreatedAt = now
                              UpdatedAt = now }

                        userRepo.Create newUser |> Async.AwaitTask

                let accessToken = generateAccessToken user.Id user.Email user.Name
                let rawRefreshToken = generateRawRefreshToken ()
                let tokenHash = hashToken rawRefreshToken

                let now = DateTime.UtcNow

                let rtEntity: RefreshTokenEntity =
                    { Id = Guid.NewGuid()
                      UserId = user.Id
                      TokenHash = tokenHash
                      ExpiresAt = now.AddDays(7.0)
                      CreatedAt = now }

                let! _ = rtRepo.Create rtEntity |> Async.AwaitTask

                return
                    ok
                        {| accessToken = accessToken
                           refreshToken = rawRefreshToken
                           tokenType = "Bearer" |}
    }

let refresh
    (userRepo: UserRepository)
    (rtRepo: RefreshTokenRepository)
    (rawRefreshToken: string)
    : Async<int * string> =
    async {
        let tokenHash = hashToken (if rawRefreshToken = null then "" else rawRefreshToken)
        let! rtEntityOpt = rtRepo.FindByTokenHash tokenHash |> Async.AwaitTask

        match rtEntityOpt with
        | None -> return unauthorized "Invalid or already used token"
        | Some rtEntity when rtEntity.ExpiresAt < DateTime.UtcNow -> return unauthorized "Refresh token has expired"
        | Some rtEntity ->
            let! userOpt = userRepo.FindById rtEntity.UserId |> Async.AwaitTask

            match userOpt with
            | None -> return unauthorized "User not found"
            | Some user ->
                // Single-use rotation: delete old token, create new one
                do! rtRepo.Delete rtEntity.Id |> Async.AwaitTask

                let accessToken = generateAccessToken user.Id user.Email user.Name
                let newRawRefreshToken = generateRawRefreshToken ()
                let newTokenHash = hashToken newRawRefreshToken

                let now = DateTime.UtcNow

                let newRtEntity: RefreshTokenEntity =
                    { Id = Guid.NewGuid()
                      UserId = user.Id
                      TokenHash = newTokenHash
                      ExpiresAt = now.AddDays(7.0)
                      CreatedAt = now }

                let! _ = rtRepo.Create newRtEntity |> Async.AwaitTask

                return
                    ok
                        {| accessToken = accessToken
                           refreshToken = newRawRefreshToken
                           tokenType = "Bearer" |}
    }

let getMe (userRepo: UserRepository) (token: string option) : Async<int * string> =
    async {
        let! authResult = resolveAuth userRepo token

        match authResult with
        | Error e -> return e
        | Ok userId ->
            let! userOpt = userRepo.FindById userId |> Async.AwaitTask

            match userOpt with
            | None -> return notFound "User not found"
            | Some user ->
                return
                    ok
                        {| id = user.Id
                           email = user.Email
                           name = user.Name
                           avatarUrl = user.AvatarUrl |}
    }
