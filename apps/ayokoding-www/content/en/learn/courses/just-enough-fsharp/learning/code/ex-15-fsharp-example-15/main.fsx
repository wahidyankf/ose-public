// => seq describes a range without making a list first.
let numbers = seq { 1..1000000 }
// => take requests only the first three values.
let firstThree = numbers |> Seq.take 3 |> Seq.toList
// => This prints [1; 2; 3].
printfn "%A" firstThree
