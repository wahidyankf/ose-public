module OrganicLeverBe.Auth.GoogleAuthService

open System
open System.Threading.Tasks

/// Payload returned after verifying a Google ID token.
type GooglePayload =
    { Email: string
      Name: string
      AvatarUrl: string option
      GoogleId: string }

/// Service for verifying Google ID tokens.
/// In test mode (APP_ENV=test), accepts any token and returns a synthetic payload.
type GoogleAuthService =
    { VerifyToken: string -> Task<Result<GooglePayload, string>> }

let private isTestMode () =
    let appEnv = Environment.GetEnvironmentVariable("APP_ENV")
    appEnv = "test" || appEnv = "unit"

/// Creates a GoogleAuthService that calls Google's real token verification API
/// in production, and accepts synthetic tokens in test mode.
/// Pass forceTestMode true to bypass the environment variable check (for unit tests).
let createGoogleAuthService (forceTestMode: bool) : GoogleAuthService =
    { VerifyToken =
        fun idToken ->
            task {
                if forceTestMode || isTestMode () then
                    // In test mode, accept any token in the format "test:<email>:<name>:<googleId>"
                    // or "invalid" for rejection testing.
                    if idToken = "invalid" || String.IsNullOrEmpty idToken then
                        return Error "Invalid Google ID token"
                    elif idToken.StartsWith("test:", StringComparison.Ordinal) then
                        let parts = idToken.Substring(5).Split(':', 5)

                        if parts.Length >= 3 then
                            let avatarUrl =
                                if parts.Length > 3 && not (String.IsNullOrEmpty parts.[3]) then
                                    Some parts.[3]
                                else
                                    Some "https://test.example.com/default-avatar.png"

                            return
                                Ok
                                    { Email = parts.[0]
                                      Name = parts.[1]
                                      AvatarUrl = avatarUrl
                                      GoogleId = parts.[2] }
                        else
                            let newGuid = Guid.NewGuid().ToString("N")[..7]

                            return
                                Ok
                                    { Email = idToken.Substring(5)
                                      Name = "Test User"
                                      AvatarUrl = Some "https://test.example.com/default-avatar.png"
                                      GoogleId = sprintf "google-test-%s" newGuid }
                    else
                        return Error "Invalid Google ID token"
                else
                    try
                        let settings = Google.Apis.Auth.GoogleJsonWebSignature.ValidationSettings()

                        let clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID")

                        if not (String.IsNullOrEmpty clientId) then
                            settings.Audience <- [| clientId |]

                        let! payload = Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync(idToken, settings)

                        return
                            Ok
                                { Email = payload.Email
                                  Name = payload.Name
                                  AvatarUrl =
                                    if String.IsNullOrEmpty payload.Picture then
                                        None
                                    else
                                        Some payload.Picture
                                  GoogleId = payload.Subject }
                    with ex ->
                        return Error(sprintf "Google token verification failed: %s" ex.Message)
            } }
