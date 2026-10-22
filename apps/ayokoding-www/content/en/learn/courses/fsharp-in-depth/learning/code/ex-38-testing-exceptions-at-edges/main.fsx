// => Example 38: two raising functions pinned on type plus blame.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => Two raising functions: caller fault and programmer fault.
let greet name = if System.String.IsNullOrEmpty(name) then invalidArg "name" "empty" else name // => blames name.
let impossible () = invalidOp "unreachable here" // => invariant fault with message.
// => Each test converts a raise into a verdict string, then asserts it.
let t1 = try greet "" |> ignore; "no-raise" with :? System.ArgumentException as ex -> sprintf "arg:%s" ex.ParamName // => caller fault.
check "empty name blames name" "arg:name" t1 // => parameter name pinned.
let t2 = try impossible () |> ignore; "no-raise" with :? System.InvalidOperationException as ex -> sprintf "bug:%s" ex.Message // => programmer fault.
check "impossible reports message" "bug:unreachable here" t2 // => exact message pinned.
// => Gate and summary close the suite.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 2 tests, 0 failures.
