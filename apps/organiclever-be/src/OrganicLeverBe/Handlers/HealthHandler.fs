module OrganicLeverBe.Handlers.HealthHandler

open Giraffe

let check: HttpHandler = fun next ctx -> json {| status = "UP" |} next ctx
