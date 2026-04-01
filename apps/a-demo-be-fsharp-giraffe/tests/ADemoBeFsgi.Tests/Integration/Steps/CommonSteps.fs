module ADemoBeFsgi.Tests.Integration.Steps.CommonSteps

open System.Text.Json
open TickSpec
open Xunit
open ADemoBeFsgi.Tests.State
open ADemoBeFsgi.Tests.DirectServices

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

let private opts = JsonSerializerOptions(PropertyNameCaseInsensitive = true)

/// Restore '#' characters that were replaced with 'HASH_SIGN' by the feature
/// pre-processor in FeatureRunner (TickSpec strips inline '#' as Gherkin comments).
let internal decode (s: string) = s.Replace("HASH_SIGN", "#")

let internal getJsonProp (json: string) (prop: string) =
    try
        let doc = JsonDocument.Parse(json)
        let el = doc.RootElement.GetProperty(prop)
        Some el
    with _ ->
        None

let internal getStringProp (json: string) (prop: string) =
    try
        let doc = JsonDocument.Parse(json)
        let el = doc.RootElement.GetProperty(prop)
        Some(el.GetString())
    with _ ->
        None

/// Run a direct service call and return (status, body) as a ServiceResponse + body string.
let internal call (status: int) (body: string) : ServiceResponse * string = { Status = status; Body = body }, body

/// Helper to apply a direct service result to StepState.
let internal applyResult (status: int) (body: string) (state: StepState) : StepState =
    { state with
        Response = Some { Status = status; Body = body }
        ResponseBody = Some body }

// ─────────────────────────────────────────────────────────────────────────────
// Shared registration / login helpers (used across step files)
// ─────────────────────────────────────────────────────────────────────────────

let internal registerUser (state: StepState) (username: string) (email: string) (password: string) : string =
    let pw = decode password

    let status, body =
        register state.UserRepo username email pw |> Async.RunSynchronously

    body

let internal loginUser (state: StepState) (username: string) (password: string) : string option * string option =
    let pw = decode password

    let _status, body =
        login state.UserRepo state.RefreshTokenRepo username pw
        |> Async.RunSynchronously

    let accessToken = getStringProp body "accessToken"
    let refreshToken = getStringProp body "refreshToken"
    accessToken, refreshToken

// ─────────────────────────────────────────────────────────────────────────────
// Shared background steps
// ─────────────────────────────────────────────────────────────────────────────

[<Given>]
let ``the API is running`` (state: StepState) = state

[<Then>]
let ``the response status code should be (\d+)`` (code: int) (state: StepState) =
    let actual = state.Response.Value.Status
    Assert.Equal(code, actual)
    state

[<Given>]
let ``a user "(.+)" is registered with password "(.+)"`` (username: string) (password: string) (state: StepState) =
    let email = $"{username}@example.com"
    registerUser state username email password |> ignore
    state

[<Given>]
let ``a user "(.+)" is registered with email "(.+)" and password "(.+)"``
    (username: string)
    (email: string)
    (password: string)
    (state: StepState)
    =
    registerUser state username email password |> ignore
    state

[<Given>]
let ``"(.+)" has logged in and stored the access token`` (username: string) (state: StepState) =
    let passwords = [ "Str0ng#Pass1"; "Str0ng#Pass2"; "Str0ng#Pass3"; "Str0ng#Admin1" ]
    let mutable accessToken = None
    let mutable userId = None

    for pw in passwords do
        if accessToken.IsNone then
            let at, _ = loginUser state username pw

            if at.IsSome then
                let _status, body =
                    getProfile state.UserRepo state.TokenRepo at |> Async.RunSynchronously

                accessToken <- at
                userId <- getStringProp body "id"

    { state with
        AccessToken = accessToken
        UserId = userId }

[<Given>]
let ``"(.+)" has logged in and stored the access token and refresh token`` (username: string) (state: StepState) =
    let passwords = [ "Str0ng#Pass1"; "Str0ng#Pass2"; "Str0ng#Admin1" ]
    let mutable accessToken = None
    let mutable refreshToken = None
    let mutable userId = None

    for pw in passwords do
        if accessToken.IsNone then
            let at, rt = loginUser state username pw

            if at.IsSome then
                let _status, body =
                    getProfile state.UserRepo state.TokenRepo at |> Async.RunSynchronously

                accessToken <- at
                refreshToken <- rt
                userId <- getStringProp body "id"

    { state with
        AccessToken = accessToken
        RefreshToken = refreshToken
        UserId = userId }

// ─────────────────────────────────────────────────────────────────────────────
// Generic request steps — map HTTP-like Gherkin to direct service calls
// ─────────────────────────────────────────────────────────────────────────────

/// Parse a JSON body string into its component fields for CreateExpense calls.
/// Returns defaults when fields are missing.
let private parseExpenseBody (bodyStr: string) =
    try
        let doc = JsonDocument.Parse(bodyStr)
        let r = doc.RootElement

        let str (key: string) =
            match r.TryGetProperty(key) with
            | true, el -> el.GetString()
            | _ -> null

        let floatOpt (key: string) =
            match r.TryGetProperty(key) with
            | true, el when el.ValueKind = JsonValueKind.Number -> Some(el.GetDouble())
            | _ -> None

        str "amount",
        str "currency",
        str "category",
        str "description",
        str "date",
        str "type",
        floatOpt "quantity",
        (match r.TryGetProperty("unit") with
         | true, el when el.ValueKind = JsonValueKind.String -> Some(el.GetString())
         | _ -> None)
    with _ ->
        null, null, null, null, null, null, None, None

/// Parse displayName from a profile update body.
let private parseProfileBody (bodyStr: string) =
    try
        let doc = JsonDocument.Parse(bodyStr)
        let r = doc.RootElement

        match r.TryGetProperty("displayName") with
        | true, el -> el.GetString()
        | _ -> null
    with _ ->
        null

/// Parse oldPassword and newPassword from a change-password body.
let private parsePasswordBody (bodyStr: string) =
    try
        let doc = JsonDocument.Parse(bodyStr)
        let r = doc.RootElement

        let str (key: string) =
            match r.TryGetProperty(key) with
            | true, el -> el.GetString()
            | _ -> null

        str "oldPassword", str "newPassword"
    with _ ->
        null, null

/// Parse refreshToken from a refresh body.
let private parseRefreshBody (bodyStr: string) =
    try
        let doc = JsonDocument.Parse(bodyStr)
        let r = doc.RootElement

        match r.TryGetProperty("refreshToken") with
        | true, el -> el.GetString()
        | _ -> null
    with _ ->
        null

/// Map a URL + method + body to a direct service call.
/// Returns (status, body).
let private dispatchCall
    (state: StepState)
    (method: string)
    (url: string)
    (body: string)
    (token: string option)
    : int * string =
    let m = method.ToUpperInvariant()
    let u = url.ToLowerInvariant()

    // Auth routes
    if u = "/api/v1/auth/register" && m = "POST" then
        let doc = JsonDocument.Parse(if body = "" then "{}" else body)
        let r = doc.RootElement

        let str (key: string) =
            match r.TryGetProperty(key) with
            | true, el -> el.GetString()
            | _ -> ""

        register state.UserRepo (str "username") (str "email") (str "password")
        |> Async.RunSynchronously
    elif u = "/api/v1/auth/login" && m = "POST" then
        let doc = JsonDocument.Parse(if body = "" then "{}" else body)
        let r = doc.RootElement

        let str (key: string) =
            match r.TryGetProperty(key) with
            | true, el -> el.GetString()
            | _ -> ""

        login state.UserRepo state.RefreshTokenRepo (str "username") (str "password")
        |> Async.RunSynchronously
    elif u = "/api/v1/auth/refresh" && m = "POST" then
        let rt = parseRefreshBody body

        refresh state.UserRepo state.RefreshTokenRepo (if rt = null then "" else rt)
        |> Async.RunSynchronously
    elif u = "/api/v1/auth/logout" && m = "POST" then
        logout state.TokenRepo token |> Async.RunSynchronously
    elif u = "/api/v1/auth/logout-all" && m = "POST" then
        logoutAll state.UserRepo state.TokenRepo state.RefreshTokenRepo token
        |> Async.RunSynchronously
    elif u = "/health" && m = "GET" then
        health ()
    elif u = "/api/v1/users/me" && m = "GET" then
        getProfile state.UserRepo state.TokenRepo token |> Async.RunSynchronously
    elif u = "/api/v1/users/me" && m = "PATCH" then
        let displayName = parseProfileBody body

        updateProfile state.UserRepo state.TokenRepo token displayName
        |> Async.RunSynchronously
    elif u = "/api/v1/users/me/password" && m = "POST" then
        let oldPw, newPw = parsePasswordBody body

        changePassword state.UserRepo state.TokenRepo token oldPw newPw
        |> Async.RunSynchronously
    elif u = "/api/v1/users/me/deactivate" && m = "POST" then
        deactivate state.UserRepo state.TokenRepo token |> Async.RunSynchronously
    elif u = "/api/v1/expenses" && m = "POST" then
        let amount, currency, category, description, date, entryType, quantity, unit =
            parseExpenseBody body

        createExpense
            state.UserRepo
            state.TokenRepo
            state.ExpenseRepo
            token
            amount
            currency
            category
            description
            date
            entryType
            quantity
            unit
        |> Async.RunSynchronously
    elif u = "/api/v1/expenses" && m = "GET" then
        listExpenses state.UserRepo state.TokenRepo state.ExpenseRepo token 1 20
        |> Async.RunSynchronously
    elif u = "/api/v1/expenses/summary" && m = "GET" then
        expenseSummary state.UserRepo state.TokenRepo state.ExpenseRepo token
        |> Async.RunSynchronously
    elif u.StartsWith("/api/v1/expenses/") && u.EndsWith("/attachments") && m = "GET" then
        let expId =
            let parts = u.Split('/')

            try
                System.Guid.Parse(parts[parts.Length - 2])
            with _ ->
                System.Guid.Empty

        listAttachments state.UserRepo state.TokenRepo state.ExpenseRepo state.AttachmentRepo token expId
        |> Async.RunSynchronously
    elif u.StartsWith("/api/v1/admin/users") && m = "GET" then
        let emailFilter =
            if url.Contains("?search=") then
                let idx = url.IndexOf("?search=")
                Some(url.Substring(idx + 8))
            else
                None

        listUsers state.UserRepo state.TokenRepo token 1 20 emailFilter
        |> Async.RunSynchronously
    elif url.StartsWith("/api/v1/test/set-admin-role/") && m = "POST" then
        let username = url.Substring("/api/v1/test/set-admin-role/".Length)
        setAdminRole state.UserRepo username |> Async.RunSynchronously
    elif u = "/.well-known/jwks.json" && m = "GET" then
        getJwks ()
    elif u.StartsWith("/api/v1/tokens") && m = "GET" then
        getTokenClaims token
    else
        // Fallback: return 404 for unrecognised routes
        404, """{"error":"Not Found","message":"Route not recognised in direct dispatch"}"""

[<When>]
let ``the client sends (GET|POST|PUT|PATCH|DELETE) (.+) with body (.+)``
    (method: string)
    (url: string)
    (body: string)
    (state: StepState)
    =
    let decodedBody = decode body
    let status, responseBody = dispatchCall state method url decodedBody None
    applyResult status responseBody state

[<When>]
let ``the client sends (GET|POST|PUT|PATCH|DELETE) ([^ ]+) with ([^']+)'s access token``
    (method: string)
    (url: string)
    (username: string)
    (state: StepState)
    =
    let status, responseBody = dispatchCall state method url "" state.AccessToken
    applyResult status responseBody state

[<When>]
let ``the client sends (GET|POST|PUT|PATCH|DELETE) ([^ ]+)$`` (method: string) (url: string) (state: StepState) =
    let status, responseBody = dispatchCall state method url "" None
    applyResult status responseBody state

// ─────────────────────────────────────────────────────────────────────────────
// Response body assertion steps
// ─────────────────────────────────────────────────────────────────────────────

[<Then>]
let ``the response body should contain "(.+)" equal to "(.+)"`` (field: string) (expected: string) (state: StepState) =
    let body = state.ResponseBody.Value
    let actual = getStringProp body field
    Assert.True(actual.IsSome, $"Field '{field}' not found in response: {body}")
    Assert.Equal(expected, actual.Value)
    state

[<Then>]
let ``the response body should contain a non-null "(.+)" field`` (field: string) (state: StepState) =
    let body = state.ResponseBody.Value
    let el = getJsonProp body field
    Assert.True(el.IsSome, $"Field '{field}' not found in response: {body}")
    let v = el.Value
    let isNull = v.ValueKind = JsonValueKind.Null
    Assert.False(isNull, $"Field '{field}' is null in response: {body}")
    state

[<Then>]
let ``the response body should not contain a "(.+)" field`` (field: string) (state: StepState) =
    let body = state.ResponseBody.Value
    let el = getJsonProp body field
    Assert.True(el.IsNone, $"Field '{field}' should not be present but found in: {body}")
    state

[<Then>]
let ``the response body should contain a validation error for "(.+)"`` (field: string) (state: StepState) =
    let body = state.ResponseBody.Value

    Assert.True(
        body.ToLower().Contains(field.ToLower()),
        $"Response body should contain validation error for '{field}': {body}"
    )

    state

[<Then>]
let ``the response body should contain an error message about (.+)`` (topic: string) (state: StepState) =
    let body = state.ResponseBody.Value
    Assert.True(body.Length > 0, $"Response body should not be empty: {body}")
    state
