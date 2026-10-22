// => Kata 7 solution: logic promoted to a module, pinned by a suite.
module Billing = // => the promoted boundary: one job inside.
    // => The bulk rule, now an addressable function instead of a loose binding.
    let rate qty = if qty >= 10 then 0.9 else 1.0 // => the rule as a promise.
    // => The total, computed from the rule through one door.
    let total qty price = float qty * price * rate qty // => the single public function.
// => The suite pins the module through the course check helper.
let results = ResizeArray<string * bool>() // => the suite record.
let check name expected actual = // => compare, record, print one line.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => Three facts pin the promoted module from both sides of its boundary.
check "bulk rate" 0.9 (Billing.rate 12) // => bulk earns ten percent off.
check "small rate" 1.0 (Billing.rate 3) // => small pays full price.
check "bulk total" 108.0 (Billing.total 12 10.0) // => the module total end to end.
// => Gate and counted summary close the kata.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 3 tests, 0 failures.
