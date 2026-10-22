// => Example 37: a parser pinned on both its tags with four cases.
let results = ResizeArray<string * bool>() // => the suite record reused here.
// => Same helper: compare, record, print one line per case.
let check name expected actual = // => name, want, and got in.
    let passed = expected = actual // => the verdict as data.
    results.Add((name, passed)) // => every case remembered.
    if passed then printfn "PASS %s" name // => green prints bare.
    else printfn "FAIL %s: expected %A got %A" name expected actual // => red prints both sides.
// => The parser under test: digits wrap, anything else complains exactly.
let parseAge (text: string) = // => text in, tagged outcome out.
    match System.Int32.TryParse(text) with // => total attempt, no throw.
    | true, n -> Ok n // => digits ride Ok.
    | false, _ -> Error (sprintf "not a number: %s" text) // => exact complaint text.
// => Four cases: two values by equality, two messages byte for byte.
check "parses 36" (Ok 36) (parseAge "36") // => good input pins its number.
check "parses 0" (Ok 0) (parseAge "0") // => zero is a number too.
check "rejects old" (Error "not a number: old") (parseAge "old") // => exact message pinned.
check "rejects empty" (Error "not a number: ") (parseAge "") // => empty names itself.
// => Gate and summary close the suite.
let failed = results |> Seq.filter (fun (_, p) -> not p) |> Seq.length // => red count.
if failed > 0 then failwithf "%d checks failed" failed // => red stops nonzero.
printfn "suite: %d tests, %d failures" results.Count failed // => suite: 4 tests, 0 failures.
