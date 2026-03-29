module OrganicLeverBe.Contracts.ContractWrappers

// Request wrappers with [<CLIMutable>] for JSON deserialization.
// Field names match the camelCase JSON keys from the API contract.
// [<CLIMutable>] ensures System.Text.Json can deserialize request bodies.

[<CLIMutable>]
type AuthGoogleRequest = { idToken: string }

[<CLIMutable>]
type RefreshRequest = { refreshToken: string }
