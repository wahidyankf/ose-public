// => Example 71: a word-count pipeline read in three layers.
let lines = [ "ada loves engines"; "grace loves engines too" ] // => layer one: the source shape.
// => Layer two: each stage's contract, read without running anything.
let counts = // => the three-stage count, layers composed.
    lines // => source: two lines in.
    |> List.collect (fun l -> l.Split(' ') |> Array.toList) // => stage one: lines to words.
    |> List.countBy id // => stage two: words to (word, count) pairs.
    |> List.sortBy (fun (w, c) -> (-c, w)) // => stage three: count desc, word asc.
// => Layer three: the answer type — a sorted pair list — checked below.
let top = List.head counts // => ("engines", 2): most frequent first.
printfn "top=%s x%d distinct=%d" (fst top) (snd top) counts.Length // => top=engines x2 distinct=5.
