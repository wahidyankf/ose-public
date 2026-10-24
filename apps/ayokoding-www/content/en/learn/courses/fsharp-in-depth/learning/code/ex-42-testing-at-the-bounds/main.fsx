// => Example 42: a safe average pinned at its four bounds.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The function under test: empty answers None, the rest average.
let safeAverage (xs: float list) = // => list in, optional average out.
    match xs with // => the empty case leads because it decides the shape.
    | [] -> None // => no values: absence, not a crash.
    | _ -> Some (List.sum xs / float xs.Length) // => the middle follows freely.
// => Four bounds: the empty miss plus three hits at increasing size.
check "empty is None" None (safeAverage []) // => the case most code misses.
check "singleton self" (Some 4.0) (safeAverage [ 4.0 ]) // => one value averages itself.
check "pair exact" (Some 1.5) (safeAverage [ 1.0; 2.0 ]) // => two values, exact mean.
check "range formula" (Some 50.5) (safeAverage [ for i in 1 .. 100 -> float i ]) // => 1..100 averages 50.5.
// => Gate and summary close the suite.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 4 tests, 0 failures.
