module DemoBeFsgi.Handlers.TokenHandler

open System
open System.IdentityModel.Tokens.Jwt
open Giraffe
open DemoBeFsgi.Auth.JwtService

let claims: HttpHandler =
    fun next ctx ->
        task {
            let authHeader = ctx.Request.Headers["Authorization"].ToString()

            let token =
                if authHeader.StartsWith("Bearer ") then
                    authHeader.Substring(7)
                else
                    ""

            let handler = JwtSecurityTokenHandler()

            let claimsData =
                try
                    let jwt = handler.ReadJwtToken(token)
                    jwt.Claims |> Seq.map (fun c -> c.Type, c.Value) |> Map.ofSeq |> Some
                with _ ->
                    None

            match claimsData with
            | None ->
                ctx.Response.StatusCode <- 400

                return!
                    json
                        {| error = "Bad Request"
                           message = "Cannot decode token" |}
                        earlyReturn
                        ctx
            | Some claimsMap -> return! json claimsMap next ctx
        }

let jwks: HttpHandler = fun next ctx -> task { return! json (getJwks ()) next ctx }
