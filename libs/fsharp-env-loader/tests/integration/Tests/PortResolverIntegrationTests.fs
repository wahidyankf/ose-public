module FsharpEnvLoader.Tests.Integration.Tests.PortResolverIntegrationTests

// Integration proof for port-resolver.feature: the resolver reads the real
// process environment through Environment.GetEnvironmentVariable, and every
// variable it reads is set, cleared, and restored on the real process.

open System
open Xunit
open FsharpEnvLoader

let private prefixedVar = "OSE_WWW_PORT"

let private readRealEnvironment (name: string) : string = Environment.GetEnvironmentVariable name

/// Runs `body` with the real process variable `name` set to `value` (null clears it),
/// restoring the prior value afterwards.
let private withRealEnv (name: string) (value: string) (body: unit -> unit) : unit =
    let previous = Environment.GetEnvironmentVariable name

    try
        Environment.SetEnvironmentVariable(name, value)
        body ()
    finally
        Environment.SetEnvironmentVariable(name, previous)

/// Mirrors the feature's `When the port resolves with a "--port" flag of "<value>"` step.
let private resolveWithFlag (flagValue: string) : Result<int, string> =
    PortResolver.resolvePort [| "--port"; flagValue |] readRealEnvironment prefixedVar 3100

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: A port resolves from the highest source that supplies one
[<Theory>]
[<InlineData("5000", "4000", 5000)>]
[<InlineData("", "4000", 4000)>]
[<InlineData("", "", 3100)>]
let ``A port resolves from the highest source that supplies one`` (flagValue: string, envValue: string, expected: int) =
    withRealEnv prefixedVar envValue (fun () -> Assert.Equal(Ok expected, resolveWithFlag flagValue))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: A bare PORT variable never moves the listener
[<Fact>]
let ``A bare PORT variable never moves the listener`` () =
    withRealEnv "PORT" "4000" (fun () ->
        withRealEnv prefixedVar null (fun () ->
            Assert.Equal(Ok 3100, PortResolver.resolvePort [||] readRealEnvironment prefixedVar 3100)))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: A blank value at a tier falls through to the next tier
[<Theory>]
[<InlineData("", "4000", 4000)>]
[<InlineData("", "", 3100)>]
[<InlineData("5000", "", 5000)>]
let ``A blank value at a tier falls through to the next tier`` (flagValue: string, envValue: string, expected: int) =
    withRealEnv prefixedVar envValue (fun () -> Assert.Equal(Ok expected, resolveWithFlag flagValue))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: A present but malformed port is rejected with an error naming its source and the valid range
[<Theory>]
[<InlineData("--port", "0", "")>]
[<InlineData("--port", "65536", "")>]
[<InlineData("--port", "abc", "")>]
[<InlineData("--port", "3100abc", "")>]
[<InlineData("--port", "31.5", "")>]
[<InlineData("--port", "-1", "")>]
[<InlineData("--port", "0x10", "")>]
[<InlineData("--port", "0b1010", "")>]
[<InlineData("--port", "1e3", "")>]
[<InlineData("--port", "+3100", "")>]
[<InlineData("OSE_WWW_PORT", "", "not-a-port")>]
let ``A present but malformed port is rejected with an error naming its source and the valid range``
    (source: string, flagValue: string, envValue: string)
    =
    withRealEnv prefixedVar envValue (fun () ->
        match resolveWithFlag flagValue with
        | Error message ->
            Assert.Contains(source, message)
            Assert.Contains("between", message)
        | Ok port -> Assert.Fail($"expected a rejection naming {source} but resolution returned {port}"))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: An out-of-range fallback is rejected with an error naming the variable and the valid range
[<Fact>]
let ``An out-of-range fallback is rejected with an error naming the variable and the valid range`` () =
    withRealEnv prefixedVar null (fun () ->
        match PortResolver.resolvePort [||] readRealEnvironment prefixedVar 70000 with
        | Error message ->
            Assert.Contains(prefixedVar, message)
            Assert.Contains("between", message)
        | Ok port -> Assert.Fail($"expected a rejection but resolution returned {port}"))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: The joined form --port=4000 is accepted like --port 4000
[<Fact>]
let ``The joined form --port=4000 is accepted like --port 4000`` () =
    withRealEnv prefixedVar null (fun () ->
        Assert.Equal(Ok 4000, PortResolver.resolvePort [| "--port=4000" |] readRealEnvironment prefixedVar 3100))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: A trailing bare --port with no value falls through to the variable
[<Fact>]
let ``A trailing bare --port with no value falls through to the variable`` () =
    withRealEnv prefixedVar "4000" (fun () ->
        Assert.Equal(Ok 4000, PortResolver.resolvePort [| "--port" |] readRealEnvironment prefixedVar 3100))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: A whitespace-only flag or variable is blank and falls through to the next tier
[<Fact>]
let ``A whitespace-only flag or variable is blank and falls through to the next tier`` () =
    withRealEnv prefixedVar "   " (fun () ->
        Assert.Equal(Ok 3100, PortResolver.resolvePort [| "--port"; "   " |] readRealEnvironment prefixedVar 3100))

// @scenario specs/libs/fsharp-env-loader/behaviours/port-resolver/port-resolver.feature: The listen URL binds loopback on a developer machine and wildcard inside a container
[<Theory>]
[<InlineData("", "http://localhost:8302")>]
[<InlineData("true", "http://+:8302")>]
let ``The listen URL binds loopback on a developer machine and wildcard inside a container``
    (container: string, expected: string)
    =
    withRealEnv "DOTNET_RUNNING_IN_CONTAINER" container (fun () ->
        Assert.Equal(expected, PortResolver.listenUrl readRealEnvironment 8302))
