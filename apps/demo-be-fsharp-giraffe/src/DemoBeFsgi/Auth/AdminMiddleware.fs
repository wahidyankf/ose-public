module DemoBeFsgi.Auth.AdminMiddleware

open Giraffe

let requireAdmin: HttpHandler =
    fun next ctx ->
        task {
            let role =
                if ctx.Items.ContainsKey("Role") then
                    ctx.Items["Role"] :?> string
                else
                    ""

            if role = "ADMIN" then
                return! next ctx
            else
                ctx.Response.StatusCode <- 403

                return!
                    json
                        {| error = "Forbidden"
                           message = "Admin access required" |}
                        earlyReturn
                        ctx
        }
