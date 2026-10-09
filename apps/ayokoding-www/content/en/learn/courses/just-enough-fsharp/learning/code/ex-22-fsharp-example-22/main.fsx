// => Each stage receives the previous stage's value.
let answer =
    // => Begin with the four source integers.
    [1; 2; 3; 4]
    // => Retain 2 and 4 because only those values are even.
    |> List.filter (fun value -> value % 2 = 0)
    // => Square the retained values to obtain 4 and 16.
    |> List.map (fun value -> value * value)
// => The even squares are 4 and 16.
printfn "%A" answer
