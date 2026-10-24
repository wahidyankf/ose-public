// => Example 15: flaky work retried under an explicit attempt budget.
let mutable calls = 0 // => the flaky counter: fails twice, then succeeds.
// => The operation under test: two failures baked in, then a success.
let flaky () = // => unit in, tagged outcome out.
    calls <- calls + 1 // => count the attempt before deciding.
    if calls <= 2 then Error (sprintf "boom on try %d" calls) // => first two tries fail.
    else Ok (sprintf "ok on try %d" calls) // => third try succeeds.
// => Retry threads the budget: each failure spends one attempt.
let rec retry budget = // => remaining attempts in, final outcome out.
    // => Zero means spent: answer the exhaustion instead of calling again.
    if budget <= 0 then Error "gave up" // => the give-up path is a value.
    else // => attempts remain: run once and decide.
        match flaky () with // => run the operation a single time.
        | Ok msg -> Ok msg // => success answers immediately, budget unspent.
        | Error _ -> retry (budget - 1) // => failure spends one attempt.
// => Same operation, two budgets: success with three, give-up with one.
let r1 = retry 3 // => three attempts: fails twice, wins on the third.
calls <- 0 // => reset the flaky counter for the second run.
let r2 = retry 1 // => one attempt: fails once, budget spent.
let show o = match o with Ok m -> m | Error m -> m // => render tags uniformly.
printfn "%s | %s" (show r1) (show r2) // => ok on try 3 | gave up.
