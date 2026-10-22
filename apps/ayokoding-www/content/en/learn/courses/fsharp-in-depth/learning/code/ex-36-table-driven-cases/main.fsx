// => Example 36: five grade boundaries checked from one data table.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper shape as Example 35: compare, record, print one line.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The function under test: score in, letter out.
let grade s = if s >= 90 then "A" elif s >= 80 then "B" elif s >= 60 then "C" else "F" // => three bands plus fail.
// => The table: boundary scores with their expected letters, five rows.
let rows = [ (100, "A"); (90, "A"); (85, "B"); (60, "C"); (59, "F") ] // => top, edges, and the fail line.
// => One loop runs every row through the same check with its own name.
for (score, want) in rows do check (sprintf "grade %d" score) want (grade score) // => five cases, one runner.
// => Gate and summary close the suite exactly like Example 35.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 5 tests, 0 failures.
