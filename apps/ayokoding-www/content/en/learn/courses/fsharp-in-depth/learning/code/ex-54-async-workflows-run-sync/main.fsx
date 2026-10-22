// => Example 54: two async stages sequenced, then run once in order.
let fetchName () = async { return "ada" } // => stage one: the name, cold until run.
// => Stage two: the score, equally cold until something runs it.
let fetchScore () = async { return 95 } // => the score stage, described not started.
// => The plan: await the name, then the score, then join them.
let report = async { // => the composed workflow, still cold.
    // => let! awaits each stage in turn: order fixed by construction.
    let! name = fetchName () // => name resolves before the next stage starts.
    let! score = fetchScore () // => score resolves after the name.
    // => The joined answer is the workflow's own return value.
    return sprintf "%s:%d" name score } // => one string out of two stages.
// => Running executes each stage exactly once, in the written order.
let line = Async.RunSynchronously report // => ada:95, deterministically.
printfn "%s" line // => ada:95.
