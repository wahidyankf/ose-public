// => Doubling a nonnegative integer remains nonnegative here.
let double value = value * 2
// => Keep values small enough to avoid integer overflow.
let samples = [0; 1; 5; 100]
// => Every sample must satisfy the same property.
assert (samples |> List.forall (fun value -> double value >= 0))
// => This prints passed.
printfn "passed"
