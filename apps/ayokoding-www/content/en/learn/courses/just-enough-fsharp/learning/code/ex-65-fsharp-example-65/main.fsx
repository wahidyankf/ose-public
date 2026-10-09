// => The initial map has one entry.
let original = Map.ofList ["tea", 2]
// => Map.add returns a new map.
let updated = Map.add "coffee" 3 original
// => The old map lacks coffee; the new one has it.
printfn "%A, %A" (Map.tryFind "coffee" original) (Map.tryFind "coffee" updated)
