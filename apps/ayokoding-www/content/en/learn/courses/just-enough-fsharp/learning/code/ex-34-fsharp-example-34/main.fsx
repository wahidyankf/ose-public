// => Map.ofList creates an immutable key-value map.
let prices = Map.ofList ["tea", 3; "coffee", 5]
// => tryFind returns Some or None.
let found = Map.tryFind "tea" prices
// => This prints Some 3.
printfn "%A" found
