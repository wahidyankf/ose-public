// => Example 41: loader pinned to its fixture, writer to its round trip.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The loader under test: read, trim, drop blanks, sort.
let loadRoster path = // => path in, clean sorted names out.
    System.IO.File.ReadAllLines(path) // => raw lines from the fixture.
    |> Array.map (fun s -> s.Trim()) // => per-line whitespace stripped.
    |> Array.filter (fun s -> s <> "") // => blank lines removed.
    |> Array.sort // => alphabetical: the loader's contract.
// => Fixture test: the committed roster arrives cleaned and sorted.
let dir = __SOURCE_DIRECTORY__ // => the unit folder anchors the fixture.
check "roster loads sorted" [|"ada"; "grace"; "lin"|] (loadRoster (System.IO.Path.Combine(dir, "roster.txt"))) // => fixture pinned.
// => Scratch test: fixed bytes round-trip through /tmp, then vanish.
let scratch = "/tmp/fsharp-in-depth-ex-41-scratch.txt" // => the one fixed scratch path.
System.IO.File.WriteAllText(scratch, "ping\n") // => fixed bytes written.
let back = System.IO.File.ReadAllText(scratch) // => the same bytes reread.
System.IO.File.Delete(scratch) // => residue removed before asserting.
check "round trip exact" "ping\n" back // => writer pinned byte for byte.
check "scratch removed" false (System.IO.File.Exists(scratch)) // => cleanup pinned too.
// => Gate and summary close the suite.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 3 tests, 0 failures.
