// => map calls the function once for each item.
let doubled = [2; 4; 6] |> List.map (fun value -> value * 2)
// => The original literals remain unchanged.
let result = doubled
// => This prints [4; 8; 12].
printfn "%A" result
