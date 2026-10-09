// => Some contains a value; None means no match.
let findEven values = values |> List.tryFind (fun value -> value % 2 = 0)
// => The first even number is present.
let found = findEven [1; 3; 4]
// => This prints Some 4.
printfn "%A" found
