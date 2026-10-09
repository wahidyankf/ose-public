// => An array's elements can change in place.
let counters = [|1; 2; 3|]
// => The indexed assignment changes element one.
counters.[1] <- 5
// => This prints [|1; 5; 3|].
printfn "%A" counters
