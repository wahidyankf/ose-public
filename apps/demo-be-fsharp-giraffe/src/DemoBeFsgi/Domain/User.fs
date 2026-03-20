module DemoBeFsgi.Domain.User

open System
open DemoBeFsgi.Domain.Types

type User =
    { Id: Guid
      Username: string
      Email: string
      DisplayName: string
      PasswordHash: string
      Role: Role
      Status: UserStatus
      FailedLoginAttempts: int
      CreatedAt: DateTime
      UpdatedAt: DateTime }

// Password validation: min 12 chars, at least one uppercase, one special char, one digit
let validatePassword (password: string) : Result<string, DomainError> =
    if String.IsNullOrEmpty password then
        Error(ValidationError("password", "Password is required"))
    elif password.Length < 12 then
        Error(ValidationError("password", "Password must be at least 12 characters"))
    elif not (password |> Seq.exists Char.IsUpper) then
        Error(ValidationError("password", "Password must contain at least one uppercase letter"))
    elif not (password |> Seq.exists Char.IsDigit) then
        Error(ValidationError("password", "Password must contain at least one digit"))
    elif not (password |> Seq.exists (fun c -> not (Char.IsLetterOrDigit c))) then
        Error(ValidationError("password", "Password must contain at least one special character"))
    else
        Ok password

let validateEmail (email: string) : Result<string, DomainError> =
    if String.IsNullOrEmpty email then
        Error(ValidationError("email", "Email is required"))
    elif not (email.Contains("@") && email.Contains(".")) then
        Error(ValidationError("email", "Invalid email format"))
    else
        Ok email

let validateUsername (username: string) : Result<string, DomainError> =
    if String.IsNullOrEmpty username then
        Error(ValidationError("username", "Username is required"))
    elif username.Length < 3 then
        Error(ValidationError("username", "Username must be at least 3 characters"))
    else
        Ok username
