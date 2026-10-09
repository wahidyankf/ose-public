// => The initial total is zero.
let total = [4; 5; 6] |> List.fold (fun sum value -> sum + value) 0
// => The accumulator advances once per item.
let result = total
// => This prints 15.
printfn "%d" result
