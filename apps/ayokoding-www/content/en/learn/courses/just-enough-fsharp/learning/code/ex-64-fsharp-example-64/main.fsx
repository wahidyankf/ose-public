// => A Set retains one copy of each ID.
let ids = ["a"; "b"; "a"]
// => Comparing counts detects at least one duplicate.
let hasDuplicates = List.length ids <> (ids |> Set.ofList |> Set.count)
// => This prints true.
printfn "%b" hasDuplicates
