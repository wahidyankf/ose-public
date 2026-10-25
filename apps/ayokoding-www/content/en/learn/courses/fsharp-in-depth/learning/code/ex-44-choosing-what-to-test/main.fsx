// => Example 44: a sorter tested on contract, surviving any rewrite.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The sorter under test: pairs ordered by their second element.
let bySecond pairs = List.sortBy snd pairs // => implementation detail, untested directly.
// => Three contract assertions: order, membership, and tie stability.
let input = [ ("b", 2); ("a", 1); ("c", 2) ] // => the fixed unsorted input.
let output = bySecond input // => the one sorted answer under test.
check "sorted by second" [ ("a", 1); ("b", 2); ("c", 2) ] output // => exact order pinned.
check "members kept" (List.sort input) (List.sort output) // => nothing lost, nothing added.
check "ties stable" [ "b"; "c" ] (output |> List.filter (fun (_, v) -> v = 2) |> List.map fst) // => ties keep input order.
// => Gate and summary close the suite.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 3 tests, 0 failures.
