// => pairwise overlaps neighboring values.
let changes = [3; 7; 6] |> List.pairwise
// => Map each pair to the difference between its members.
let differences = changes |> List.map (fun (left, right) -> right - left)
// => This prints [4; -1].
printfn "%A" differences
