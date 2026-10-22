// => Example 62: one summary in canonical pipeline layout.
let roster = [ ("ada", 95); ("grace", 88); ("lin", 72) ] // => the fixed name-and-score table.
// => Source first, one stage per line, each pipe leading its line.
let summary = // => the honor roll, computed down the page.
    roster // => the source: everything flows from here.
    |> List.filter (fun (_, s) -> s >= 80) // => stage one: keep honors only.
    |> List.map (fun (n, _) -> n.ToUpperInvariant()) // => stage two: names upcased.
    |> List.sort // => stage three: alphabetical for determinism.
    |> String.concat ", " // => stage four: one printable line.
// => The transcript pins the layout's answer: two honors, sorted, joined.
printfn "%s" summary // => ADA, GRACE.
