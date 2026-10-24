// => Example 14: three faults, three shapes, each routed to its actor.
let greet (name: string) = // => the contract: a non-empty name.
    // => Caller fault: blame the argument by name so the caller fixes the call.
    if System.String.IsNullOrEmpty(name) then invalidArg "name" "name must not be empty" // => caller fixes.
    else sprintf "hi %s" name // => the happy path answers a greeting.
// => Programmer fault: an invariant the code itself broke, not the caller.
let impossible flag = // => flag claims which branch is reachable.
    match flag with // => both real cases covered below.
    | true -> "reachable" // => the branch the program can actually take.
    | false -> invalidOp "unreachable: flag is always true here" // => programmer fixes the logic.
// => World fault: the fixture may be absent; callers handle both tags.
let readFixture path = // => path in, content or complaint out.
    if System.IO.File.Exists(path) then Ok (System.IO.File.ReadAllText(path).Trim()) // => present file reads.
    else Error (sprintf "missing fixture: %s" path) // => absent file is data, not a crash.
// => Each fault prints through its own handling: catch, catch, match.
let p1 = try greet "" with :? System.ArgumentException as ex -> sprintf "arg=%s" ex.ParamName // => caller fault.
let p2 = try impossible false |> ignore; "no-raise" with :? System.InvalidOperationException as ex -> sprintf "bug=%s" ex.Message // => programmer fault.
let p3 = match readFixture "nope.txt" with Ok s -> s | Error m -> m // => world fault handled.
printfn "%s | %s | %s" p1 p2 p3 // => arg=name | bug=unreachable: flag is always true here | missing fixture: nope.txt.
