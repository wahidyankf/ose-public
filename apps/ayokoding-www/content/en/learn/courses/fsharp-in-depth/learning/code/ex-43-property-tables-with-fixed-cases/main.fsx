// => Example 43: double-reverse identity over thirty-two fixed lists.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The property under test: reverse twice returns the list.
let prop xs = List.rev (List.rev xs) = xs // => identity through double reverse.
// => Thirty-two lists by formula: lengths and contents vary, runs do not.
let tables = [ for i in 0 .. 31 -> [ for j in 1 .. (i % 8) -> (i * 7 + j) % 13 ] ] // => fixed generation.
// => One assertion per table; names carry the index for failing-case lookup.
tables |> List.iteri (fun i xs -> check (sprintf "rev-rev %02d" i) true (prop xs)) // => thirty-two cases.
// => Gate and counted summary close the suite; breadth printed, not implied.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 32 tests, 0 failures.
