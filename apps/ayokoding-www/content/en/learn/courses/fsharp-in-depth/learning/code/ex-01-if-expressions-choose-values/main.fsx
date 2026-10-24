// => Example 1: if/then/else is an expression that answers with a value.
let score = 85 // => the fixed input every branch below decides on.
// => Both branches must answer the same type, so one binding holds either outcome.
let grade = // => the grade binding the whole chain answers into.
    // => The condition decides; the winning branch value flows out.
    if score >= 90 then "A" // => top branch: the distinction band.
    // => elif chains stay expressions: every path still answers a string.
    elif score >= 80 then "B" // => middle branch: the passing band.
    // => else closes the chain with the fallback value.
    else "C" // => fallback branch: every other score lands here.
// => One binding, one print: the decision is data now, not control flow.
printfn "score=%d grade=%s" score grade // => score=85 grade=B.
