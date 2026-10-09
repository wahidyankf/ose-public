// => Count how many source items are actually generated.
let mutable generated = 0
// => Source enumeration increments the counter for each item.
let source = seq {
    // => The loop can yield three squared numbers.
    for n in 1..3 do
        // => This side effect makes a repeated enumeration visible.
        generated <- generated + 1
        // => Each item is the square of its input.
        yield n * n
}
// => Cache each generated value as the first consumer requests it.
let cached = source |> Seq.cache
// => The first pass produces all three values.
let first = cached |> Seq.toList
// => Capture the count before the second pass.
let afterFirst = generated
// => This pass reuses the cache instead of running source again.
let second = cached |> Seq.toList
// => Both lists match and the count stays at three.
// => The unchanged count is the evidence of caching.
printfn "%A; %A; generated %d -> %d" first second afterFirst generated
