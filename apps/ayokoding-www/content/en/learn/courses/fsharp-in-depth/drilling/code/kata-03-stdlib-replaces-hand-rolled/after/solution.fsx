// => Kata 3 solution: the library call replaces the loop and the cell.
let names = [ "ada"; "grace"; "lin" ] // => the same fixed roster.
// => One pipeline: project each length, sum them, no loop, no mutable cell.
let total = names |> List.sumBy (fun s -> s.Length) // => the library answers 12.
// => Same transcript as the starter: behavior kept, machinery removed.
printfn "total=%d" total // => total=12, now pinned by Example 8's question rule.
