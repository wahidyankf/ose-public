// => Kata 4 starter: three nested checks collect the honor roll.
let scores = [ ("ada", 95); ("grace", 88); ("lin", 72) ] // => the fixed table.
// => Nested branches filter, transform, and collect in one tangle.
let mutable honors: string list = [] // => the collected names, built backwards.
for (name, score) in scores do // => walk every row by hand.
    if score >= 80 then // => the filter hides inside the loop.
        let upper = name.ToUpperInvariant() // => the transform hides inside the branch.
        honors <- upper :: honors // => prepend reverses the order.
// => Reverse back and join: the pipeline stages scattered as statements.
let line = System.String.Join(", ", List.rev honors |> List.sort) // => sort repairs the order.
printfn "%s" line // => ADA, GRACE from nested branches.
