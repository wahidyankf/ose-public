// => Example 55: five doublings in parallel, answers in input order.
let doubleAsync n = async { return n * 2 } // => one cold doubling stage per number.
// => Five stages described, none running yet: the list is a plan.
let stages = [ 1; 2; 3; 4; 5 ] |> List.map doubleAsync // => one stage per input.
// => Parallel runs them together; positions follow the input list.
let answers = Async.Parallel stages |> Async.RunSynchronously // => [|2; 4; 6; 8; 10|].
// => Sorted by construction: position i holds double of i, every run.
printfn "%A" (Array.toList answers) // => [2; 4; 6; 8; 10].
