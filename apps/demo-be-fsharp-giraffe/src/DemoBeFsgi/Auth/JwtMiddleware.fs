module DemoBeFsgi.Auth.JwtMiddleware

open System
open System.Security.Claims
open Giraffe
open Microsoft.EntityFrameworkCore
open DemoBeFsgi.Infrastructure.AppDbContext
open DemoBeFsgi.Domain.Types

let requireAuth: HttpHandler =
    fun next ctx ->
        task {
            let authHeader = ctx.Request.Headers["Authorization"].ToString()

            if
                String.IsNullOrEmpty authHeader
                || not (authHeader.StartsWith("Bearer ", StringComparison.Ordinal))
            then
                ctx.Response.StatusCode <- 401

                return!
                    json
                        {| error = "Unauthorized"
                           message = "Missing or invalid Authorization header" |}
                        earlyReturn
                        ctx
            else
                let token = authHeader.Substring(7)
                let principal = JwtService.validateToken token

                match principal with
                | None ->
                    ctx.Response.StatusCode <- 401

                    return!
                        json
                            {| error = "Unauthorized"
                               message = "Invalid or expired token" |}
                            earlyReturn
                            ctx
                | Some claims ->
                    let jti = JwtService.getTokenJti token
                    let db = ctx.GetService<AppDbContext>()

                    let! isRevoked =
                        match jti with
                        | None -> Threading.Tasks.Task.FromResult(true)
                        | Some j -> db.RevokedTokens.AsNoTracking().AnyAsync(fun rt -> rt.Jti = j)

                    if isRevoked then
                        ctx.Response.StatusCode <- 401

                        return!
                            json
                                {| error = "Unauthorized"
                                   message = "Token has been revoked" |}
                                earlyReturn
                                ctx
                    else
                        let sub =
                            claims.FindFirst(fun c ->
                                c.Type = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")

                        let sub2 =
                            if sub = null then
                                claims.FindFirst(fun c -> c.Type = "sub")
                            else
                                sub

                        if sub2 = null then
                            ctx.Response.StatusCode <- 401

                            return!
                                json
                                    {| error = "Unauthorized"
                                       message = "Invalid token claims" |}
                                    earlyReturn
                                    ctx
                        else
                            let userId =
                                try
                                    Guid.Parse(sub2.Value) |> Some
                                with _ ->
                                    None

                            match userId with
                            | None ->
                                ctx.Response.StatusCode <- 401

                                return!
                                    json
                                        {| error = "Unauthorized"
                                           message = "Invalid user ID in token" |}
                                        earlyReturn
                                        ctx
                            | Some uid ->
                                let! user = db.Users.AsNoTracking().FirstOrDefaultAsync(fun u -> u.Id = uid)

                                if obj.ReferenceEquals(user, null) then
                                    ctx.Response.StatusCode <- 401

                                    return!
                                        json
                                            {| error = "Unauthorized"
                                               message = "User not found" |}
                                            earlyReturn
                                            ctx
                                elif user.Status <> statusToString Active then
                                    ctx.Response.StatusCode <- 401

                                    if user.Status = statusToString Locked then
                                        return!
                                            json
                                                {| error = "Unauthorized"
                                                   message = "Account is locked" |}
                                                earlyReturn
                                                ctx
                                    else
                                        return!
                                            json
                                                {| error = "Unauthorized"
                                                   message = "Account has been deactivated" |}
                                                earlyReturn
                                                ctx
                                else
                                    ctx.Items["UserId"] <- uid :> obj
                                    ctx.Items["Username"] <- user.Username :> obj
                                    ctx.Items["Email"] <- user.Email :> obj
                                    ctx.Items["Role"] <- user.Role :> obj
                                    return! next ctx
        }
