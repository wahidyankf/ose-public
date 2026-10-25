// => Example 39: a regression case replaying the red-then-green cycle.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The fixed function: bulk orders earn ten percent off, boundary inclusive.
let discount qty = if qty >= 10 then 0.9 else 1.0 // => >= keeps the tenth unit discounted.
// => History: this case ran red when the guard read > 10; the tenth order paid full price.
check "bulk starts at ten" 0.9 (discount 10) // => the boundary the old code missed.
// => Neighbours pin the fix from both sides so it cannot drift back.
check "nine pays full" 1.0 (discount 9) // => just below the boundary.
check "eleven discounted" 0.9 (discount 11) // => just above the boundary.
// => Gate and summary close the suite; green now, red once, history kept.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 3 tests, 0 failures.
