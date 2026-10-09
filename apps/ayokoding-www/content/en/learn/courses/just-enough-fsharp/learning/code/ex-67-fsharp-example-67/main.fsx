// => The counter starts before any sequence item is requested.
let mutable produced = 0
// => Defining the sequence does not run its body.
let numbers = seq {
    // => Each requested item advances the generator once.
    for n in 1..3 do
        // => Count only an item actually pulled by a consumer.
        produced <- produced + 1
        // => Yield the current number after counting it.
        yield n
}
// => This prints zero before enumeration.
printfn "before: %d" produced
// => take is lazy; toList requests exactly two items.
// => The third value is never requested.
let firstTwo = numbers |> Seq.take 2 |> Seq.toList
// => The counter is now two and the values are [1; 2].
printfn "after: %d; values: %A" produced firstTwo
