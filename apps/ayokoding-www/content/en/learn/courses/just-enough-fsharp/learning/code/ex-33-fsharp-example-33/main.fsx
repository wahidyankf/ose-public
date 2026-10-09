// => The key is whether each number is even.
let groups = [1; 2; 3; 4] |> List.groupBy (fun value -> value % 2 = 0)
// => Group keys appear in first-seen order.
let oddGroup = groups |> List.find (fun (key, _) -> not key) |> snd
// => This prints [1; 3].
printfn "%A" oddGroup
