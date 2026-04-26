module OrganicLeverBe.Tests.State

open System.Net.Http

/// Represents a simulated HTTP-style response from a direct service call.
/// Status maps to HTTP status codes; Body is JSON text.
type ServiceResponse = { Status: int; Body: string }

type StepState =
    { HttpClient: HttpClient
      Response: ServiceResponse option
      ResponseBody: string option }

let empty (httpClient: HttpClient) =
    { HttpClient = httpClient
      Response = None
      ResponseBody = None }
