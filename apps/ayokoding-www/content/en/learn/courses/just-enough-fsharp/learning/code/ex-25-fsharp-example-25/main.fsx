// => The predicate returns true for positive values.
let positives = [-2; 0; 3; 5] |> List.filter (fun value -> value > 0)
// => Filter retains the original order.
let result = positives
// => This prints [3; 5].
printfn "%A" result
