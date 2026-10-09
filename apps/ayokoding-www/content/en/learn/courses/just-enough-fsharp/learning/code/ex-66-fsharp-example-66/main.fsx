// => Map.map receives both key and value.
let prices = Map.ofList ["tea", 3; "coffee", 5]
// => Ignore the key because only the price changes.
let increased = prices |> Map.map (fun _ price -> price + 1)
// => Tea now costs 4 in the new map.
printfn "%A" (Map.tryFind "tea" increased)
