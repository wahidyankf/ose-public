// => Kata 2 solution: the first suite pins the discount with two facts.
let results = ResizeArray<string * bool>() // => the suite record: name plus verdict.
// => check compares, records, and prints one fixed line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => the suite remembers every case.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The function under test, unchanged from the starter.
let discount total = if total > 100 then total * 9 / 10 else total // => the pinned rule.
// => Two facts pin the rule from both sides of its boundary.
check "discounts large totals" 180 (discount 200) // => large totals take ten percent off.
check "leaves small totals alone" 50 (discount 50) // => small totals pass through.
// => Gate and counted summary close the kata.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 2 tests, 0 failures.
