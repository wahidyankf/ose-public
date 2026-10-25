// => Example 35: the check helper every testing example reuses.
let results = ResizeArray<string * bool>() // => the suite record: name plus verdict.
// => check compares, records, and prints: one fixed line per case.
let check name expected actual = // => name, want, and got in.
    // => Equality decides; the line prints both sides only when they differ.
    let passed = expected = actual // => the verdict as data.
    // => Record first so a later failure cannot erase an earlier verdict.
    results.Add((name, passed)) // => the suite remembers every case.
    // => One fixed line per case: the golden file pins each.
    if passed then printfn "PASS %s" name // => green cases print bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => Two fixed cases pin down doubling; both pass on this run.
check "double 21" 42 (21 * 2) // => arithmetic fact one.
check "double 0" 0 (0 * 2) // => arithmetic fact two.
// => The gate: silence when green, an exception when red.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => count the red cases.
if failed > 0 then failwithf "%d checks failed" failed // => red stops the script nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 2 tests, 0 failures.
