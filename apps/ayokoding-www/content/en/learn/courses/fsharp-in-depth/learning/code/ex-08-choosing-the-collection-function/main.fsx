// => Example 8: six questions, six canonical functions, one roster.
let roster = [ "ada"; "grace"; "ada"; "lin" ] // => the fixed roster with a duplicate.
// => Membership is a set question: build the set once, ask it cheaply.
let members = Set.ofList roster // => deduped set for membership tests.
// => tryFind stops at the first witness instead of walking the whole list.
let firstLong = List.tryFind (fun (s: string) -> s.Length > 3) roster // => Some "grace".
// => Counting with a predicate measures the subset without building it.
let adaCount = List.filter (fun s -> s = "ada") roster |> List.length // => 2.
// => groupBy answers the full census: every key with its members.
let groups = List.groupBy id roster |> List.sortBy fst // => sorted by name.
// => Prints name each question and its canonical answer side by side.
printfn "member=%b first=%s adas=%d groups=%A" (Set.contains "lin" members) firstLong.Value adaCount groups // => member=true first=grace adas=2 groups=[("ada", ["ada"; "ada"]); ("grace", ["grace"]); ("lin", ["lin"])].
