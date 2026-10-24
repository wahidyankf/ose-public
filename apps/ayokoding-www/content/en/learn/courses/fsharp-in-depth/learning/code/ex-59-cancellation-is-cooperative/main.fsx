// => Example 59: a pre-cancelled token stops the workflow before stage one.
open System.Threading // => CancellationTokenSource lives here.
// => Cancel first, run after: determinism without timing or races.
let verdict = // => cancelled or ran, exactly one.
    // => The token source lives in this block; cancel before any work starts.
    use cts = new CancellationTokenSource() // => scope-bound: disposal scheduled.
    cts.Cancel() // => the request is pending before any work starts.
    // => The workflow checks the token before each stage; checks are safe points.
    let work = async { // => the two-stage plan under a cancelled token.
        // => Stage gate: a pending request raises here, before any work.
        cts.Token.ThrowIfCancellationRequested() // => honor the token first.
        // => Unreached on this run: the gate above raises first.
        return "stages-ran" } // => the answer that never comes back.
    // => The boundary converts the cooperative stop into a verdict string.
    try Async.RunSynchronously work |> sprintf "ran:%s" // => would print on green.
    with :? System.OperationCanceledException -> "cancelled=true" // => the honored request.
printfn "%s" verdict // => cancelled=true.
