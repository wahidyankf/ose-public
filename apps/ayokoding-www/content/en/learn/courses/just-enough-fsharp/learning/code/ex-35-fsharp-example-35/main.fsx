// => Set.ofList removes duplicates.
let unique = Set.ofList ["go"; "fsharp"; "go"]
// => contains tests membership, not position.
let hasFsharp = Set.contains "fsharp" unique
// => This prints true and count 2.
printfn "%b, %d" hasFsharp (Set.count unique)
