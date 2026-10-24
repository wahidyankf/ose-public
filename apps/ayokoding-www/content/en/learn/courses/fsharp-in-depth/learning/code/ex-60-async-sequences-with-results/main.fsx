// => Example 60: an awaited fetch validated through a pure railway.
let fetchScore () = async { return 95 } // => the cold fetch stage.
// => Pure railway: number in, labeled result out, no awaiting inside.
let classify score = // => the validation railway, testable without tasks.
    let checkRange n = if n >= 0 && n <= 100 then Ok n else Error (sprintf "bad score: %d" n) // => range gate.
    let label n = if n >= 60 then Ok "pass" else Ok "retry" // => labeling never fails.
    Ok score |> Result.bind checkRange |> Result.bind label // => the chain.
// => The workflow awaits once, then hands the value to the railway.
let verdict = async { // => waiting layer outside, branching layer inside.
    let! score = fetchScore () // => the single await point.
    // => Railway result renders through one match at the workflow edge.
    return match classify score with Ok s -> s | Error m -> sprintf "error: %s" m } // => pass.
// => Run once: fetch, validate, label, print — order fixed throughout.
printfn "%s" (Async.RunSynchronously verdict) // => pass.
