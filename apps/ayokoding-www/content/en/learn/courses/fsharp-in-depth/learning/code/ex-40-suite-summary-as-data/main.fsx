// => Example 40: the summary is data, and the report obeys it.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => Three fixed facts about string casing under test.
check "upper ada" "ADA" ("ada".ToUpperInvariant()) // => invariant uppercases.
check "lower GRACE" "grace" ("GRACE".ToLowerInvariant()) // => invariant lowercases.
check "trim pads" "lin" ("  lin  ".Trim()) // => surrounding spaces strip.
// => The summary record: totals computed from the suite, not asserted by hand.
let total = results.Count // => every case ran.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red cases counted.
// => The gate reads the summary value: green proceeds, red raises first.
if failed > 0 then failwithf "suite red: %d of %d failed" failed total // => red stops the report.
printfn "suite: %d tests, %d failures" total failed // => suite: 3 tests, 0 failures.
printfn "report: casing rules verified" // => this line exists only past the gate.
