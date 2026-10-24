// => Kata 4 solution: source first, one stage per line, pipes leading.
let scores = [ ("ada", 95); ("grace", 88); ("lin", 72) ] // => the same fixed table.
// => The pipeline: each stage names its job, order reads down the page.
let line = // => the honor roll, computed down the page.
    scores // => source: everything flows from here.
    |> List.filter (fun (_, s) -> s >= 80) // => stage one: keep honors only.
    |> List.map (fun (n, _) -> n.ToUpperInvariant()) // => stage two: names upcased.
    |> List.sort // => stage three: alphabetical for determinism.
    |> String.concat ", " // => stage four: one printable line.
// => Same transcript as the starter: structure changed, answers did not.
printfn "%s" line // => ADA, GRACE from one pipeline.
