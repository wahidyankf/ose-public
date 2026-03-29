module OrganicLeverBe.Auth.JwtMiddleware

open System
open System.Threading.Tasks
open Giraffe
open OrganicLeverBe.Infrastructure.Repositories.RepositoryTypes

let requireAuth: HttpHandler =
    fun next ctx ->
        task {
            let authHeader = ctx.Request.Headers["Authorization"].ToString()
            // Force state machine into state 1 before error paths so AltCover can track them.
            let! () = Task.CompletedTask

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
                            let userRepo = ctx.GetService<UserRepository>()
                            let! userOpt = userRepo.FindById uid

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
                                ctx.Items["UserId"] <- uid :> obj
                                ctx.Items["Email"] <- user.Email :> obj
                                ctx.Items["Name"] <- user.Name :> obj
                                return! next ctx
        }
