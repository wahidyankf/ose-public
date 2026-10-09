// => The guard checks the extracted number.
let label value =
    // => Test each option case in order.
    match value with
    // => A present number greater than zero takes this branch.
    | Some number when number > 0 -> "positive"
    // => Other present numbers, including zero, reach this branch.
    | Some _ -> "non-positive"
    // => None reaches the final branch, so the match is complete.
    | None -> "missing"
// => This prints positive.
printfn "%s" (label (Some 3))
