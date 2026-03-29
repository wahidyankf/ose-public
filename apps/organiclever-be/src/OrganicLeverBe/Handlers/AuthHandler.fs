module OrganicLeverBe.Handlers.AuthHandler

open System
open System.Text.Json
open System.Threading.Tasks
open Giraffe
open OrganicLeverBe.Infrastructure.AppDbContext
open OrganicLeverBe.Infrastructure.Repositories.RepositoryTypes
open OrganicLeverBe.Auth.GoogleAuthService
open OrganicLeverBe.Auth.JwtService
open OrganicLeverBe.Contracts.ContractWrappers

let googleLogin: HttpHandler =
    fun _next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()
            // Force state machine into state 2+ before error paths so AltCover can track them.
            let! () = Task.CompletedTask

            let req =
                try
                    JsonSerializer.Deserialize<AuthGoogleRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

            match req with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Invalid request body" |}
                        earlyReturn
                        ctx
            | Some r when String.IsNullOrEmpty(r.idToken) ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "idToken is required" |}
                        earlyReturn
                        ctx
            | Some r ->
                let googleSvc = ctx.GetService<GoogleAuthService>()
                let! verifyResult = googleSvc.VerifyToken r.idToken

                match verifyResult with
                | Error msg ->
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = msg |}
                            earlyReturn
                            ctx
                | Ok payload ->
                    let userRepo = ctx.GetService<UserRepository>()
                    let rtRepo = ctx.GetService<RefreshTokenRepository>()

                    let! existingOpt = userRepo.FindByGoogleId payload.GoogleId

                    let! user =
                        match existingOpt with
                        | Some existing ->
                            let updated =
                                { existing with
                                    Name = payload.Name
                                    AvatarUrl = payload.AvatarUrl |> Option.defaultValue existing.AvatarUrl
                                    UpdatedAt = DateTime.UtcNow }

                            userRepo.Update updated
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

                            userRepo.Create newUser

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

                    let! _ = rtRepo.Create rtEntity

                    return!
                        json
                            {| accessToken = accessToken
                               refreshToken = rawRefreshToken
                               tokenType = "Bearer" |}
                            earlyReturn
                            ctx
        }

let refresh: HttpHandler =
    fun _next ctx ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync()
            // Force state machine into state 2+ before error paths so AltCover can track them.
            let! () = Task.CompletedTask

            let req =
                try
                    JsonSerializer.Deserialize<RefreshRequest>(
                        body,
                        JsonSerializerOptions(PropertyNameCaseInsensitive = true)
                    )
                    |> Some
                with _ ->
                    None

            match req with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Invalid request body" |}
                        earlyReturn
                        ctx
            | Some r ->
                let userRepo = ctx.GetService<UserRepository>()
                let rtRepo = ctx.GetService<RefreshTokenRepository>()

                let tokenHash = hashToken (if r.refreshToken = null then "" else r.refreshToken)
                let! rtEntityOpt = rtRepo.FindByTokenHash tokenHash

                match rtEntityOpt with
                | None ->
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Invalid or already used token" |}
                            earlyReturn
                            ctx
                | Some rtEntity when rtEntity.ExpiresAt < DateTime.UtcNow ->
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Refresh token has expired" |}
                            earlyReturn
                            ctx
                | Some rtEntity ->
                    let! userOpt = userRepo.FindById rtEntity.UserId

                    match userOpt with
                    | None ->
                        ctx.Response.StatusCode <- 401

                        return!
                            json
                                {| error = "Unauthorized"
                                   message = "User not found" |}
                                earlyReturn
                                ctx
                    | Some user ->
                        // Single-use rotation: delete old token, create new one
                        do! rtRepo.Delete rtEntity.Id

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

                        let! _ = rtRepo.Create newRtEntity

                        return!
                            json
                                {| accessToken = accessToken
                                   refreshToken = newRawRefreshToken
                                   tokenType = "Bearer" |}
                                earlyReturn
                                ctx
        }

let me: HttpHandler =
    fun _next ctx ->
        task {
            let userId = ctx.Items["UserId"] :?> Guid
            let userRepo = ctx.GetService<UserRepository>()

            let! userOpt = userRepo.FindById userId

            match userOpt with
            | None ->
                ctx.Response.StatusCode <- 404

                return!
                    json
                        {| error = "Not Found"
                           message = "User not found" |}
                        earlyReturn
                        ctx
            | Some user ->
                return!
                    json
                        {| id = user.Id
                           email = user.Email
                           name = user.Name
                           avatarUrl = user.AvatarUrl |}
                        earlyReturn
                        ctx
        }
