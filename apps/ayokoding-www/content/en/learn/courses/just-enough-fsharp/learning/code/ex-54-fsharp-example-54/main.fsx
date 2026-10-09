// => partition returns a tuple of two lists.
let even, odd = [1; 2; 3; 4] |> List.partition (fun n -> n % 2 = 0)
// => Both groups preserve input order.
let result = even, odd
// => This prints ([2; 4], [1; 3]).
printfn "%A" result
